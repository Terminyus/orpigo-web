"""Merge section copy (content_*.py) into src/i18n/*.json, keeping hero/meta/etc."""
import json, pathlib, sys
here = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(here))
from content_tr import TR
from content_en import EN
for lang, extra in (("tr", TR), ("en", EN)):
    p = here.parent / "src" / "i18n" / f"{lang}.json"
    d = json.loads(p.read_text())
    for k, v in extra.items():
        if isinstance(v, dict) and isinstance(d.get(k), dict):
            d[k].update(v)
        else:
            d[k] = v
    p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n")
    print(lang, len(json.dumps(d)))
