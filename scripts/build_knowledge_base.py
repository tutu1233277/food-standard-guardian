from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "public" / "knowledge-base" / "pdfs"
OUTPUT_PATH = ROOT / "public" / "knowledge-base" / "standards-kb.json"

KEYWORD_LIBRARY = [
    "自行监测",
    "监测方案",
    "监测频次",
    "执行报告",
    "信息记录",
    "规范性引用文件",
    "废水",
    "废气",
    "噪声",
    "土壤",
    "地下水",
    "无组织排放",
    "污染源",
    "危废",
    "排放口",
    "采样",
    "电子工业",
    "印刷工业",
    "砖瓦工业",
    "石油炼制",
    "电池工业",
    "冷却水",
]

SECTION_PATTERN = re.compile(r"(?m)^\s*(\d+(?:\.\d+)*)\s+([^\n]{2,40})")
CODE_PATTERN = re.compile(r"(GB/T\s*\d{3,6}[—-]\d{4}|HJ\s*\d{3,6}[—-]\d{4})")
DATE_PATTERN = re.compile(r"(\d{4}-\d{2}-\d{2})\s*发布.*?(\d{4}-\d{2}-\d{2})\s*实施", re.S)


@dataclass
class StandardDoc:
    id: str
    title: str
    code: str
    category: str
    industry: str
    issuer: str
    release_date: str
    effective_date: str
    page_count: int
    source_file: str
    relative_pdf_path: str
    preview: str
    scope: str
    sections: list[str]
    keywords: list[str]
    search_text: str
    full_text: str

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "code": self.code,
            "category": self.category,
            "industry": self.industry,
            "issuer": self.issuer,
            "releaseDate": self.release_date,
            "effectiveDate": self.effective_date,
            "pageCount": self.page_count,
            "sourceFile": self.source_file,
            "relativePdfPath": self.relative_pdf_path,
            "preview": self.preview,
            "scope": self.scope,
            "sections": self.sections,
            "keywords": self.keywords,
            "searchText": self.search_text,
            "fullText": self.full_text,
        }


def normalize_text(text: str) -> str:
    text = text.replace("\u3000", " ")
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def clean_filename_label(name: str) -> str:
    name = name.replace("+", " ")
    name = name.replace("（水印版）20220509", "")
    name = name.replace("（水印版）20220510", "")
    name = name.replace(".pdf", "")
    return re.sub(r"\s+", " ", name).strip()


def extract_title(first_page: str, fallback_name: str) -> str:
    compact = normalize_text(first_page)
    if "排污单位自行监测技术指南" in compact:
      match = re.search(r"排污单位自行监测技术指南\s*[—\-–]?\s*([^\n]{2,50})", compact)
      if match:
          suffix = match.group(1).strip(" —-–")
          suffix = suffix.split("Self-monitoring")[0].strip()
          if suffix:
              return f"排污单位自行监测技术指南·{suffix}"
      if "电池工业" in compact:
          return "排污单位自行监测技术指南·电池工业"
    if "工业循环冷却水零排污技术规范" in compact:
        return "工业循环冷却水零排污技术规范"
    return clean_filename_label(fallback_name)


def extract_category_and_industry(title: str) -> tuple[str, str]:
    if title.startswith("排污单位自行监测技术指南·"):
        return "自行监测技术指南", title.removeprefix("排污单位自行监测技术指南·")
    if "冷却水" in title:
        return "零排污技术规范", "工业循环冷却水"
    return "工业排污标准", title


def extract_issuer(text: str) -> str:
    if "生态环境部" in text:
        return "生态环境部"
    if "国家市场监督管理总局" in text:
        return "国家市场监督管理总局 / 国家标准化管理委员会"
    if "环境保护部" in text:
        return "环境保护部"
    return "标准文件"


def extract_dates(text: str) -> tuple[str, str]:
    match = DATE_PATTERN.search(text)
    if match:
        return match.group(1), match.group(2)
    return "", ""


def extract_scope(text: str) -> str:
    candidates = [
        r"本标准规定了([^。]{10,180}。)",
        r"本标准适用于([^。]{10,180}。)",
        r"本文件规定了([^。]{10,180}。)",
        r"本文件适用于([^。]{10,180}。)",
    ]
    for pattern in candidates:
        match = re.search(pattern, text)
        if match:
            return normalize_text(match.group(0))
    return normalize_text(text[:180])


def extract_sections(text: str) -> list[str]:
    results: list[str] = []
    seen = set()
    for number, title in SECTION_PATTERN.findall(text):
        label = f"{number} {normalize_text(title)}"
        if len(title) > 40:
            continue
        if label in seen:
            continue
        seen.add(label)
        results.append(label)
        if len(results) >= 10:
            break
    return results


def extract_keywords(text: str, title: str, industry: str) -> list[str]:
    words = []
    merged = f"{title}\n{industry}\n{text}"
    for keyword in KEYWORD_LIBRARY:
        if keyword in merged:
            words.append(keyword)
    return words


def build_entry(pdf_path: Path) -> StandardDoc:
    reader = PdfReader(str(pdf_path))
    pages = [normalize_text(page.extract_text() or "") for page in reader.pages]
    full_text = "\n\n".join(page for page in pages if page)
    first_page = pages[0] if pages else ""
    title = extract_title(first_page, pdf_path.name)
    category, industry = extract_category_and_industry(title)
    code_match = CODE_PATTERN.search(first_page)
    code = code_match.group(1).replace(" ", "") if code_match else clean_filename_label(pdf_path.stem)
    release_date, effective_date = extract_dates(first_page)
    preview = normalize_text(first_page[:220])
    scope = extract_scope(full_text)
    sections = extract_sections(full_text)
    keywords = extract_keywords(full_text, title, industry)
    search_text = " ".join([title, code, category, industry, scope, *keywords, *sections])
    return StandardDoc(
        id=re.sub(r"[^a-z0-9]+", "-", code.lower()).strip("-"),
        title=title,
        code=code,
        category=category,
        industry=industry,
        issuer=extract_issuer(first_page),
        release_date=release_date,
        effective_date=effective_date,
        page_count=len(reader.pages),
        source_file=pdf_path.name,
        relative_pdf_path=f"/knowledge-base/pdfs/{pdf_path.name}",
        preview=preview,
        scope=scope,
        sections=sections,
        keywords=keywords,
        search_text=search_text,
        full_text=full_text,
    )


def main() -> None:
    docs = [build_entry(path) for path in sorted(PDF_DIR.glob("*.pdf"))]
    payload = {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "documentCount": len(docs),
        "totalPages": sum(doc.page_count for doc in docs),
        "documents": [doc.to_dict() for doc in docs],
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Knowledge base written to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
