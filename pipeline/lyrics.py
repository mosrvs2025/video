"""Parse a lyrics .txt with [Section — description] tags into sections/lines/words."""
import re, json, sys

def parse(path):
    sections, cur, lines = [], None, []
    for raw in open(path, encoding="utf-8"):
        s = raw.strip()
        if not s:
            continue
        m = re.fullmatch(r"\[(.+)\]", s)
        if m:
            name = re.split(r"\s+[—-]\s+", m.group(1))[0].strip()
            if name.startswith("Male voice"): name = "Intro"
            cur = {"name": name, "tag": m.group(1), "lines": []}
            sections.append(cur)
            continue
        if cur is None:           # title
            continue
        if cur["tag"].startswith(("Intro", "Beat drops", "Beat Switch")):
            continue              # pure sound-design tags carry no lyrics
        cur["lines"].append(s)
    out, li = [], 0
    for sec in sections:
        for ln in sec["lines"]:
            out.append({"i": li, "section": sec["name"], "tag": sec["tag"], "text": ln})
            li += 1
    return out

def words(text):
    """Display words (keep punctuation) and aligner tokens (lowercase letters/apostrophes)."""
    disp = [w for w in re.split(r"\s+", text.replace("—", " ").replace("...", " ")) if re.search(r"[A-Za-z0-9]", w)]
    toks = [re.sub(r"[^a-z']", "", w.lower().replace("’", "'")).strip("'") or "x" for w in disp]
    return disp, toks

if __name__ == "__main__":
    ls = parse(sys.argv[1])
    for l in ls: l["words"], l["toks"] = words(l["text"])
    print(len(ls), "lines", sum(len(l["words"]) for l in ls), "words")
    json.dump(ls, open(sys.argv[2], "w"), indent=1, ensure_ascii=False)
