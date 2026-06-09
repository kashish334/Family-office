"""
services/OCR_service.py – Receipt OCR using EasyOCR with smart field extraction.
"""
import re
from decimal import Decimal
from pathlib import Path

from loguru import logger


class OCRService:
    """
    Extracts transaction data from receipt images using EasyOCR.
    Loaded lazily to avoid GPU init at startup.
    """

    _reader = None

    @classmethod
    def _get_reader(cls):
        if cls._reader is None:
            import easyocr
            cls._reader = easyocr.Reader(["en"], gpu=False)
        return cls._reader

    async def extract_from_image(self, image_path: str) -> dict:
        """
        Run OCR on the image and extract structured receipt data.
        Returns a dict with: merchant, date, total, items, raw_text.
        """
        try:
            reader = self._get_reader()
            results = reader.readtext(image_path, detail=1)
            raw_lines = [text for (_, text, conf) in results if conf > 0.4]
            raw_text = "\n".join(raw_lines)

            return {
                "merchant_name": self._extract_merchant(raw_lines),
                "total_amount": self._extract_total(raw_lines),
                "date": self._extract_date(raw_lines),
                "items": self._extract_line_items(raw_lines),
                "raw_text": raw_text,
                "confidence": self._avg_confidence(results),
            }
        except Exception as exc:
            logger.error(f"OCR extraction failed: {exc}")
            return {"raw_text": "", "error": str(exc)}

    def _extract_merchant(self, lines: list[str]) -> str | None:
        """Heuristic: first 2 meaningful lines often contain merchant name."""
        for line in lines[:3]:
            if len(line) > 3 and not re.match(r"^[\d\W]+$", line):
                return line.strip()
        return None

    def _extract_total(self, lines: list[str]) -> Decimal | None:
        """Search for TOTAL / AMOUNT DUE patterns."""
        total_pattern = re.compile(
            r"(?:total|amount\s*due|grand\s*total|balance\s*due)[:\s]*\$?([\d,]+\.?\d*)",
            re.IGNORECASE,
        )
        amount_pattern = re.compile(r"\$\s*([\d,]+\.\d{2})")

        for line in lines:
            m = total_pattern.search(line)
            if m:
                try:
                    return Decimal(m.group(1).replace(",", ""))
                except Exception:
                    pass

        # Fall back: find the largest dollar amount in the document
        amounts = []
        for line in lines:
            for m in amount_pattern.finditer(line):
                try:
                    amounts.append(Decimal(m.group(1).replace(",", "")))
                except Exception:
                    pass

        return max(amounts) if amounts else None

    def _extract_date(self, lines: list[str]) -> str | None:
        date_pattern = re.compile(
            r"\b(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}|\w+ \d{1,2},?\s*\d{4})\b"
        )
        for line in lines:
            m = date_pattern.search(line)
            if m:
                return m.group(1)
        return None

    def _extract_line_items(self, lines: list[str]) -> list[dict]:
        """Extract item name + price pairs."""
        item_pattern = re.compile(r"^(.+?)\s+\$?([\d]+\.\d{2})$")
        items = []
        for line in lines:
            m = item_pattern.match(line.strip())
            if m:
                items.append({"name": m.group(1).strip(), "amount": m.group(2)})
        return items[:20]  # cap at 20 items

    def _avg_confidence(self, results: list) -> float:
        if not results:
            return 0.0
        return round(sum(conf for (_, _, conf) in results) / len(results), 3)

    def suggest_category(self, merchant_name: str | None, raw_text: str) -> str | None:
        """Simple keyword mapping to category names."""
        combined = f"{merchant_name or ''} {raw_text}".lower()
        mappings = {
            "Food & Dining": ["restaurant", "cafe", "coffee", "pizza", "sushi", "mcdonald", "starbucks", "grubhub", "doordash"],
            "Grocery": ["supermarket", "whole foods", "trader joe", "walmart", "kroger", "safeway", "aldi"],
            "Transport": ["uber", "lyft", "taxi", "petrol", "fuel", "shell", "bp", "chevron", "parking"],
            "Healthcare": ["pharmacy", "clinic", "hospital", "medical", "cvs", "walgreens"],
            "Shopping": ["amazon", "target", "best buy", "nordstrom", "zara", "h&m"],
            "Travel": ["hotel", "airbnb", "airline", "flight", "airfare", "marriott"],
            "Entertainment": ["netflix", "spotify", "cinema", "movie", "theater", "concert"],
            "Utilities": ["electric", "water", "gas", "internet", "at&t", "verizon", "comcast"],
        }
        for category, keywords in mappings.items():
            if any(kw in combined for kw in keywords):
                return category
        return None
