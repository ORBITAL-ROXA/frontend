"""
Modulo de pos-processamento de highlights.
Aplica efeitos: color grading, HUD cyberpunk com avatar, intro, outro, concatenacao final.
"""
import os
import re
import json
import subprocess
import shutil
import requests
from .config import (
    FFMPEG, FFPROBE, LOGO_WHITE, INTRO_VIDEO,
    FONT_BOLD, FONT_LIGHT, FONT_MONO,
    WIDTH, HEIGHT, FRAMERATE, CRF, PRESET,
    FADE_DURATION, OUTRO_DURATION,
    COLOR_ACCENT, COLOR_ACCENT_LIGHT, COLOR_BG, COLOR_WHITE,
    HUD_CARD_WIDTH, HUD_CARD_HEIGHT, HUD_CARD_Y,
    HUD_SHOW_AT, HUD_ANIM_IN, HUD_ANIM_OUT, HUD_HOLD,
)


def run_ffmpeg(cmd, timeout=300):
    """Executa FFmpeg e retorna sucesso."""
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if result.returncode != 0:
        stderr = result.stderr
        error_lines = [l for l in stderr.split('\n')
                       if any(w in l.lower() for w in ['error', 'failed', 'undefined', 'invalid'])]
        if error_lines:
            print(f"  ERRO: {' | '.join(error_lines[:3])}")
        else:
            print(f"  ERRO FFmpeg (code {result.returncode})")
        return False
    return True


def get_video_duration(video_path):
    """Retorna duracao do video em segundos."""
    cmd = [
        FFPROBE, "-v", "quiet",
        "-print_format", "json",
        "-show_format", video_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    data = json.loads(result.stdout)
    return float(data["format"]["duration"])


def generate_intro(output_path):
    """Converte o video de intro customizado para 1080p/60fps."""
    if not os.path.exists(INTRO_VIDEO):
        print(f"  AVISO: Intro nao encontrada em {INTRO_VIDEO}")
        return False

    cmd = [
        FFMPEG, "-y",
        "-i", INTRO_VIDEO,
        "-vf", f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease,"
               f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:black,"
               f"fps={FRAMERATE}",
        "-ar", "44100",
        "-c:v", "libx264", "-preset", PRESET, "-crf", str(CRF),
        "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        output_path
    ]
    return run_ffmpeg(cmd)


def download_avatar(steamid, output_path):
    """Baixa avatar da Steam via perfil publico XML. Retorna True se sucesso."""
    try:
        url = f"https://steamcommunity.com/profiles/{steamid}?xml=1"
        r = requests.get(url, timeout=10)
        if r.status_code != 200:
            return False

        # Extrair avatarFull da resposta XML
        match = re.search(r'<avatarFull><!\[CDATA\[(.*?)\]\]></avatarFull>', r.text)
        if not match:
            match = re.search(r'<avatarFull>(.*?)</avatarFull>', r.text)
        if not match:
            return False

        avatar_url = match.group(1)
        img = requests.get(avatar_url, timeout=10)
        if img.status_code != 200:
            return False

        with open(output_path, "wb") as f:
            f.write(img.content)
        return True
    except Exception as e:
        print(f"  AVISO: Nao conseguiu baixar avatar: {e}")
        return False


def build_hud_filters(player, multikill, rank, kills_count, hs_count, duration,
                       has_avatar=False):
    """Gera filtros FFmpeg para o HUD card minimalista com avatar."""
    CW = HUD_CARD_WIDTH
    CH = HUD_CARD_HEIGHT
    CX = (WIDTH - CW) // 2
    CY = HUD_CARD_Y

    SHOW_AT = HUD_SHOW_AT
    ANIM_IN = HUD_ANIM_IN
    HOLD = min(HUD_HOLD, duration - 2.0)
    ANIM_OUT_DUR = HUD_ANIM_OUT
    HIDE_AT = SHOW_AT + ANIM_IN + HOLD

    def alpha_expr(delay=0):
        t_in = SHOW_AT + delay
        t_in_end = t_in + ANIM_IN
        t_out = HIDE_AT + delay * 0.5
        t_out_end = t_out + ANIM_OUT_DUR
        return (f"if(lt(t,{t_in}),0,"
                f"if(lt(t,{t_in_end}),(t-{t_in})/{ANIM_IN},"
                f"if(lt(t,{t_out}),1,"
                f"if(lt(t,{t_out_end}),({t_out_end}-t)/{ANIM_OUT_DUR},0))))")

    enable = f"enable='between(t,{SHOW_AT},{HIDE_AT + ANIM_OUT_DUR})'"
    ACCENT = COLOR_ACCENT

    # Se tem avatar, conteudo comeca mais a direita
    AVATAR_SIZE = 70
    AVATAR_PAD = 15
    content_x = CX + (AVATAR_SIZE + AVATAR_PAD * 2 if has_avatar else 20)

    parts = []

    # ── Background ──
    parts.append(f"drawbox=x={CX}:y={CY}:w={CW}:h={CH}:color=0x{COLOR_BG}@0.85:t=fill:{enable}")

    # ── Accent line no topo ──
    parts.append(f"drawbox=x={CX}:y={CY}:w={CW}:h=2:color=0x{ACCENT}:t=fill:{enable}")
    parts.append(f"drawbox=x={CX}:y={CY+2}:w={CW}:h=1:color=0x{ACCENT}@0.3:t=fill:{enable}")

    # ── Bordas sutis ──
    parts.append(f"drawbox=x={CX}:y={CY+CH-1}:w={CW}:h=1:color=0x{ACCENT}@0.15:t=fill:{enable}")
    parts.append(f"drawbox=x={CX}:y={CY}:w=1:h={CH}:color=0x{ACCENT}@0.15:t=fill:{enable}")
    parts.append(f"drawbox=x={CX+CW-1}:y={CY}:w=1:h={CH}:color=0x{ACCENT}@0.15:t=fill:{enable}")

    # ── Avatar border (se tem avatar, o overlay eh feito separado no filter_complex) ──
    if has_avatar:
        ax = CX + AVATAR_PAD
        ay = CY + (CH - AVATAR_SIZE) // 2
        # Borda purple do avatar
        parts.append(f"drawbox=x={ax-2}:y={ay-2}:w={AVATAR_SIZE+4}:h={AVATAR_SIZE+4}:color=0x{ACCENT}@0.7:t=fill:{enable}")

    # ── Player name ──
    parts.append(
        f"drawtext=fontfile='{FONT_BOLD}':"
        f"text='{player}':fontcolor=0x{COLOR_WHITE}:fontsize=42:"
        f"x={content_x}:y={CY+12}:"
        f"alpha='{alpha_expr(0)}'"
    )

    # ── Multi-kill badge ──
    badge_x = content_x + len(player) * 24 + 15
    parts.append(
        f"drawtext=fontfile='{FONT_BOLD}':"
        f"text='{multikill}':fontcolor=0x{ACCENT}:fontsize=42:"
        f"x={badge_x}:y={CY+12}:"
        f"alpha='{alpha_expr(0.05)}'"
    )

    # ── Rank + branding (canto direito) ──
    parts.append(
        f"drawtext=fontfile='{FONT_MONO}':"
        f"text='#{rank} HIGHLIGHT':fontcolor=0x{ACCENT}@0.6:fontsize=14:"
        f"x={CX+CW-155}:y={CY+15}:"
        f"alpha='{alpha_expr(0.1)}'"
    )
    parts.append(
        f"drawtext=fontfile='{FONT_MONO}':"
        f"text='ORBITAL ROXA':fontcolor=0x{ACCENT}@0.3:fontsize=11:"
        f"x={CX+CW-130}:y={CY+33}:"
        f"alpha='{alpha_expr(0.15)}'"
    )

    # ── Separador fino ──
    sep_y = CY + 60
    parts.append(f"drawbox=x={content_x}:y={sep_y}:w={CW - (content_x - CX) - 20}:h=1:color=0x{ACCENT}@0.15:t=fill:{enable}")

    # ── Stats: KILLS e HEADSHOTS ──
    stat_y = sep_y + 12
    stats = [
        ("KILLS", str(kills_count)),
        ("HEADSHOTS", str(hs_count)),
    ]

    sx = content_x
    for i, (label, value) in enumerate(stats):
        delay = 0.08 * i

        # Label pequeno
        parts.append(
            f"drawtext=fontfile='{FONT_MONO}':"
            f"text='{label}':fontcolor=0x{ACCENT}@0.7:fontsize=11:"
            f"x={sx}:y={stat_y}:"
            f"alpha='{alpha_expr(0.1 + delay)}'"
        )

        # Valor grande
        parts.append(
            f"drawtext=fontfile='{FONT_BOLD}':"
            f"text='{value}':fontcolor=0x{COLOR_WHITE}:fontsize=30:"
            f"x={sx}:y={stat_y+14}:"
            f"alpha='{alpha_expr(0.15 + delay)}'"
        )

        sx += 120

    return ",".join(parts)


def process_clip(input_path, output_path, highlight_info, tick_rate=64, with_intro=True):
    """Aplica efeitos: color grading, vignette, HUD overlay com avatar, fade. Opcionalmente adiciona intro."""
    duration = get_video_duration(input_path)

    player = highlight_info["player"]
    kills_count = highlight_info["kills_count"]
    rank = highlight_info.get("rank", 1)
    steamid = highlight_info.get("steamid", "")

    hs_count = sum(1 for k in highlight_info["kills"] if k.get("headshot"))

    if kills_count >= 5: multikill = "ACE"
    elif kills_count == 4: multikill = "4K"
    elif kills_count == 3: multikill = "3K"
    elif kills_count == 2: multikill = "2K"
    else: multikill = "1K"

    fade_out_start = max(0, duration - FADE_DURATION)

    # Tentar baixar avatar da Steam
    avatar_path = None
    if steamid:
        avatar_path = output_path + ".avatar.jpg"
        print(f"  Baixando avatar Steam para {player} ({steamid})...")
        if not download_avatar(steamid, avatar_path):
            avatar_path = None
            print(f"  Avatar nao disponivel, continuando sem")
        else:
            print(f"  Avatar OK!")

    has_avatar = avatar_path is not None and os.path.exists(avatar_path)

    hud_filter = build_hud_filters(
        player, multikill, rank, kills_count,
        hs_count, duration, has_avatar=has_avatar
    )

    # Card dimensions for avatar positioning
    CW = HUD_CARD_WIDTH
    CH = HUD_CARD_HEIGHT
    CX = (WIDTH - CW) // 2
    CY = HUD_CARD_Y
    AVATAR_SIZE = 70
    AVATAR_PAD = 15
    AX = CX + AVATAR_PAD
    AY = CY + (CH - AVATAR_SIZE) // 2

    SHOW_AT = HUD_SHOW_AT
    ANIM_IN = HUD_ANIM_IN
    HOLD = min(HUD_HOLD, duration - 2.0)
    HIDE_AT = SHOW_AT + ANIM_IN + HOLD
    ANIM_OUT_DUR = HUD_ANIM_OUT

    if has_avatar:
        # Com avatar: input[0]=video, input[1]=avatar
        filter_complex = (
            f"[0:v]eq=contrast=1.08:brightness=0.02:saturation=1.15,"
            f"unsharp=5:5:0.5:5:5:0[s1];"
            f"[s1]vignette=PI/5,format=yuv420p[s2];"
            f"[1:v]scale={AVATAR_SIZE}:{AVATAR_SIZE}:force_original_aspect_ratio=decrease,"
            f"pad={AVATAR_SIZE}:{AVATAR_SIZE}:(ow-iw)/2:(oh-ih)/2:black,format=yuva420p,"
            f"colorchannelmixer=aa="
            f"'if(lt(t,{SHOW_AT}),0,"
            f"if(lt(t,{SHOW_AT+ANIM_IN}),(t-{SHOW_AT})/{ANIM_IN},"
            f"if(lt(t,{HIDE_AT}),1,"
            f"if(lt(t,{HIDE_AT+ANIM_OUT_DUR}),({HIDE_AT+ANIM_OUT_DUR}-t)/{ANIM_OUT_DUR},0))))'[avatar];"
            f"[s2]{hud_filter}[s3];"
            f"[s3][avatar]overlay=x={AX}:y={AY}:format=auto,"
            f"fade=t=in:st=0:d={FADE_DURATION},"
            f"fade=t=out:st={fade_out_start}:d={FADE_DURATION}[vout]"
        )
    else:
        filter_complex = (
            f"[0:v]eq=contrast=1.08:brightness=0.02:saturation=1.15,"
            f"unsharp=5:5:0.5:5:5:0[s1];"
            f"[s1]vignette=PI/5,format=yuv420p[s2];"
            f"[s2]{hud_filter},"
            f"fade=t=in:st=0:d={FADE_DURATION},"
            f"fade=t=out:st={fade_out_start}:d={FADE_DURATION}[vout]"
        )

    audio_filter = (
        f"afade=t=in:st=0:d={FADE_DURATION},"
        f"afade=t=out:st={fade_out_start}:d={FADE_DURATION}"
    )

    # Passo 1: Processar clip com efeitos
    print(f"  Processando: {os.path.basename(input_path)}")
    print(f"  Player: {player} | {multikill} | {kills_count}K {hs_count}HS")

    # Se com intro, processar para arquivo temp e depois concatenar
    if with_intro and os.path.exists(INTRO_VIDEO):
        temp_processed = output_path + ".temp.mp4"
    else:
        temp_processed = output_path

    cmd = [FFMPEG, "-y", "-i", input_path]
    if has_avatar:
        cmd.extend(["-i", avatar_path])
    cmd.extend([
        "-filter_complex", filter_complex,
        "-af", audio_filter,
        "-map", "[vout]", "-map", "0:a",
        "-c:v", "libx264", "-preset", PRESET, "-crf", str(CRF),
        "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        temp_processed
    ])

    ok = run_ffmpeg(cmd)

    # Limpar avatar temp
    if avatar_path and os.path.exists(avatar_path):
        os.remove(avatar_path)

    if not ok:
        return False

    # Passo 2: Adicionar intro se solicitado
    if with_intro and os.path.exists(INTRO_VIDEO) and temp_processed != output_path:
        print(f"  Adicionando intro...")
        intro_norm = output_path + ".intro.mp4"
        if generate_intro(intro_norm):
            if concat_clips([intro_norm, temp_processed], output_path):
                print(f"  OK: {os.path.basename(output_path)} (com intro)")
                # Limpar arquivos temporarios
                os.remove(temp_processed)
                os.remove(intro_norm)
                return True
            else:
                # Fallback: usar clip sem intro
                shutil.move(temp_processed, output_path)
                if os.path.exists(intro_norm):
                    os.remove(intro_norm)
        else:
            shutil.move(temp_processed, output_path)
    else:
        print(f"  OK: {os.path.basename(output_path)}")

    return True


def generate_outro(output_path):
    """Gera clip de outro com logo e URL do site."""
    d = OUTRO_DURATION

    filter_complex = (
        f"color=c=black:s={WIDTH}x{HEIGHT}:d={d}:r={FRAMERATE}[bg];"
        f"[1:v]scale=200:-1,format=rgba[logo];"
        f"[bg][logo]overlay=(W-w)/2:(H-h)/2-50:format=auto,"
        f"drawtext=fontfile='{FONT_LIGHT}':"
        f"text='orbitalroxa.com.br':"
        f"fontcolor=0x{COLOR_ACCENT}:fontsize=30:"
        f"x=(w-text_w)/2:y=(h/2)+70:"
        f"alpha='if(lt(t,0.3),t/0.3,if(gt(t,{d-0.5}),({d}-t)/0.5,1))',"
        f"fade=t=in:st=0:d=0.5,fade=t=out:st={d-0.5}:d=0.5"
        f"[vout]"
    )

    cmd = [
        FFMPEG, "-y",
        "-f", "lavfi", "-i", f"color=c=black:s={WIDTH}x{HEIGHT}:d={d}:r={FRAMERATE}",
        "-i", LOGO_WHITE,
        "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=stereo",
        "-filter_complex", filter_complex,
        "-map", "[vout]", "-map", "2:a",
        "-t", str(d),
        "-c:v", "libx264", "-preset", PRESET, "-crf", str(CRF),
        "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        output_path
    ]
    return run_ffmpeg(cmd)


def concat_clips(clip_paths, output_path):
    """Concatena clips em um video final."""
    list_file = os.path.join(os.path.dirname(output_path), "_concat_list.txt")
    with open(list_file, "w", encoding="utf-8") as f:
        for p in clip_paths:
            abs_path = os.path.abspath(p).replace("\\", "/")
            f.write(f"file '{abs_path}'\n")

    cmd = [
        FFMPEG, "-y",
        "-f", "concat", "-safe", "0",
        "-i", list_file,
        "-c", "copy",
        "-movflags", "+faststart",
        output_path
    ]

    ok = run_ffmpeg(cmd, timeout=600)
    if os.path.exists(list_file):
        os.remove(list_file)
    return ok


def postprocess(highlights_json, clips_dir, output_dir=None):
    """Pipeline principal de pos-processamento."""
    print(f"\n{'='*60}")
    print(f"  ORBITAL ROXA - Post-Processing Pipeline")
    print(f"{'='*60}\n")

    with open(highlights_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    highlights = data["highlights"]
    tick_rate = data["tick_rate"]

    if output_dir is None:
        output_dir = os.path.join(clips_dir, "processed")
    os.makedirs(output_dir, exist_ok=True)

    clip_files = sorted([f for f in os.listdir(clips_dir) if f.endswith(".mp4")])

    if not clip_files:
        print("ERRO: Nenhum clip .mp4 encontrado em", clips_dir)
        return

    print(f"  Clips encontrados: {len(clip_files)}")
    print(f"  Highlights: {len(highlights)}")

    clip_highlight_map = []
    for h in highlights:
        pattern = f"tick-{h['tick_start']}-to-{h['tick_end']}"
        matched = next((cf for cf in clip_files if pattern in cf), None)
        if matched:
            clip_highlight_map.append((matched, h))
        else:
            print(f"  AVISO: Clip nao encontrado para {h['description']}")

    if not clip_highlight_map:
        print("ERRO: Nenhum clip mapeado para highlights!")
        return

    # 1. Intro
    print("\n[1/4] Gerando intro...")
    intro_path = os.path.join(output_dir, "_intro.mp4")
    intro_ok = generate_intro(intro_path)
    print(f"  {'OK' if intro_ok else 'Falhou (continuando sem intro)'}")

    # 2. Processar clips (rank reverso = climax no final)
    print("\n[2/4] Processando clips...")
    processed_clips = []
    clip_highlight_map.sort(key=lambda x: x[1]["rank"], reverse=True)

    for clip_file, h in clip_highlight_map:
        input_path = os.path.join(clips_dir, clip_file)
        out_name = f"processed_{h['rank']}_{h['player'].replace(' ', '_')}_r{h['round']}.mp4"
        out_path = os.path.join(output_dir, out_name)

        if process_clip(input_path, out_path, h, tick_rate):
            processed_clips.append(out_path)

    # 3. Outro
    print("\n[3/4] Gerando outro...")
    outro_path = os.path.join(output_dir, "_outro.mp4")
    outro_ok = generate_outro(outro_path)
    print(f"  {'OK' if outro_ok else 'Falhou (continuando sem outro)'}")

    # 4. Concatenar
    print("\n[4/4] Concatenando video final...")
    final_parts = []
    if intro_ok:
        final_parts.append(intro_path)
    final_parts.extend(processed_clips)
    if outro_ok:
        final_parts.append(outro_path)

    final_output = os.path.join(output_dir, "ORBITAL_ROXA_HIGHLIGHTS.mp4")

    if len(final_parts) > 1:
        if concat_clips(final_parts, final_output):
            final_size = os.path.getsize(final_output) / (1024 * 1024)
            print(f"\n{'='*60}")
            print(f"  VIDEO FINAL: {final_output}")
            print(f"  Tamanho: {final_size:.1f} MB")
            print(f"  Clips: {len(processed_clips)} highlights")
            print(f"{'='*60}")
    elif len(final_parts) == 1:
        shutil.copy2(final_parts[0], final_output)
        print(f"  Video final: {final_output}")

    print(f"\n  Clips individuais em: {output_dir}")
    for pc in processed_clips:
        size_mb = os.path.getsize(pc) / (1024 * 1024)
        print(f"    - {os.path.basename(pc)} ({size_mb:.1f} MB)")
