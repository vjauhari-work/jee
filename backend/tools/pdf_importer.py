#!/usr/bin/env python3
"""
PDF Question Paper Importer

Extracts MCQ questions from JEE/CBSE PDF question papers and outputs
structured JSON ready for MongoDB import.

Usage:
    python3 pdf_importer.py <pdf_path> --section jee_mains --subject physics --year 2024
    python3 pdf_importer.py <pdf_path> --section boards_12 --subject chemistry --year 2024 --output questions.json

The script:
1. Extracts text from the PDF using pdfplumber (with pymupdf fallback)
2. Detects question boundaries using common patterns (Q.1, 1., (1), etc.)
3. Parses options (A)/(B)/(C)/(D) or (a)/(b)/(c)/(d)
4. Attempts to convert common math patterns to LaTeX notation
5. Outputs a JSON array of question objects matching the MongoDB schema

After running this script, use the Go import tool to load into MongoDB:
    go run ./cmd/import/main.go --file questions.json
"""

import argparse
import json
import re
import sys
from pathlib import Path


def extract_text_pdfplumber(pdf_path: str) -> str:
    """Extract text from PDF using pdfplumber."""
    import pdfplumber
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def extract_text_pymupdf(pdf_path: str) -> str:
    """Extract text from PDF using pymupdf (fallback)."""
    import pymupdf
    text = ""
    doc = pymupdf.open(pdf_path)
    for page in doc:
        text += page.get_text() + "\n"
    doc.close()
    return text


def extract_text(pdf_path: str) -> str:
    """Extract text from PDF, trying pdfplumber first, then pymupdf."""
    try:
        text = extract_text_pdfplumber(pdf_path)
        if text.strip():
            return text
    except Exception as e:
        print(f"pdfplumber failed: {e}, trying pymupdf...", file=sys.stderr)

    try:
        text = extract_text_pymupdf(pdf_path)
        if text.strip():
            return text
    except Exception as e:
        print(f"pymupdf also failed: {e}", file=sys.stderr)

    return ""


def math_to_latex(text: str) -> str:
    """
    Convert common math patterns in extracted text to LaTeX notation.
    This is a best-effort conversion — complex formulas may need manual cleanup.
    """
    # Square root
    text = re.sub(r'√\(([^)]+)\)', r'$\\sqrt{\1}$', text)
    text = re.sub(r'√(\d+)', r'$\\sqrt{\1}$', text)

    # Superscripts: x2 -> $x^2$, x3 -> $x^3$ (common patterns)
    text = re.sub(r'(\w)\s*²', r'$\1^2$', text)
    text = re.sub(r'(\w)\s*³', r'$\1^3$', text)

    # Fractions: a/b when surrounded by spaces or at word boundary
    text = re.sub(r'(?<!\w)(\d+)\s*/\s*(\d+)(?!\w)', r'$\\frac{\1}{\2}$', text)

    # Greek letters
    greek = {
        'α': r'$\alpha$', 'β': r'$\beta$', 'γ': r'$\gamma$', 'δ': r'$\delta$',
        'θ': r'$\theta$', 'λ': r'$\lambda$', 'μ': r'$\mu$', 'π': r'$\pi$',
        'σ': r'$\sigma$', 'ω': r'$\omega$', 'Ω': r'$\Omega$', 'φ': r'$\phi$',
        'ε': r'$\epsilon$', 'ρ': r'$\rho$', 'τ': r'$\tau$',
    }
    for char, latex in greek.items():
        text = text.replace(char, latex)

    # Infinity symbol
    text = text.replace('∞', r'$\infty$')

    # Plus-minus
    text = text.replace('±', r'$\pm$')

    # Degree symbol
    text = re.sub(r'(\d+)°', r'\1$^\\circ$', text)

    # Arrow
    text = text.replace('→', r'$\rightarrow$')
    text = text.replace('⇌', r'$\rightleftharpoons$')

    # Subscripts for chemical formulas: H2O, CO2, etc.
    text = re.sub(r'([A-Z][a-z]?)(\d)([A-Z]|$|\s|\))', r'\1$_\2$\3', text)

    # Merge adjacent LaTeX: $...$  $...$ -> $... ...$
    text = re.sub(r'\$\s*\$', ' ', text)

    return text


def split_questions(text: str) -> list[str]:
    """
    Split extracted text into individual question blocks.
    Handles various numbering patterns used in JEE/CBSE papers.
    """
    # Common question number patterns:
    # "Q.1", "Q1.", "Q 1.", "1.", "1)", "(1)", "Question 1"
    pattern = r'(?:^|\n)\s*(?:Q\.?\s*|Question\s+)?(\d{1,3})\s*[.)]\s*'

    # Find all question starts
    matches = list(re.finditer(pattern, text))

    if not matches:
        # Try alternative pattern: just numbers at line start
        pattern = r'(?:^|\n)\s*(\d{1,3})\s*[.):\s]\s*(?=[A-Z])'
        matches = list(re.finditer(pattern, text))

    if not matches:
        print("Warning: Could not detect question boundaries.", file=sys.stderr)
        return []

    blocks = []
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[start:end].strip()
        blocks.append(block)

    return blocks


def parse_question_block(block: str) -> dict | None:
    """
    Parse a single question block into question text and options.
    Returns None if parsing fails.
    """
    # Remove question number prefix
    block = re.sub(r'^\s*(?:Q\.?\s*|Question\s+)?\d{1,3}\s*[.)]\s*', '', block).strip()

    if not block:
        return None

    # Try to find options with various patterns
    option_patterns = [
        # (A) ... (B) ... (C) ... (D) ...
        r'\(([A-Da-d])\)\s*',
        # (1) ... (2) ... (3) ... (4) ...
        r'\(([1-4])\)\s*',
        # A) ... B) ... C) ... D) ...
        r'(?:^|\n)\s*([A-Da-d])\)\s*',
        # A. ... B. ... C. ... D. ...
        r'(?:^|\n)\s*([A-Da-d])\.\s*',
    ]

    options = []
    question_text = block

    for pattern in option_patterns:
        matches = list(re.finditer(pattern, block))
        if len(matches) >= 4:
            # Extract question text (everything before first option)
            question_text = block[:matches[0].start()].strip()

            # Extract each option
            for i, match in enumerate(matches[:4]):
                start = match.end()
                end = matches[i + 1].start() if i + 1 < len(matches[:4]) else len(block)
                option_text = block[start:end].strip()
                # Clean trailing option markers
                option_text = re.sub(r'\s*\([A-Da-d1-4]\)\s*$', '', option_text).strip()

                label = match.group(1).upper()
                # Map numeric options to letters
                if label in '1234':
                    label = chr(ord('A') + int(label) - 1)

                options.append({"label": label, "text": option_text})
            break

    if not question_text or len(options) < 4:
        return None

    # Clean up question text
    question_text = re.sub(r'\s+', ' ', question_text).strip()

    return {
        "question_text": question_text,
        "options": options[:4],
    }


def detect_correct_answers(text: str, num_questions: int) -> dict[int, str]:
    """
    Try to detect answer keys from the text.
    Many papers have an answer key section at the end.
    """
    answers = {}

    # Pattern: "1. (A)" or "1-A" or "1. A" in an answer key section
    answer_section = re.search(
        r'(?:Answer\s*Key|Answers|Answer\s*Sheet|Solutions?).*',
        text, re.IGNORECASE | re.DOTALL
    )

    if answer_section:
        section_text = answer_section.group(0)
        # Find answer mappings
        pattern = r'(\d{1,3})\s*[.)\-:]\s*\(?([A-Da-d])\)?'
        for match in re.finditer(pattern, section_text):
            q_num = int(match.group(1))
            answer = match.group(2).upper()
            if 1 <= q_num <= num_questions:
                answers[q_num] = answer

    return answers


def assign_topics(subject: str, section: str, index: int, total: int) -> str:
    """
    Assign a topic based on subject, section, and position in the paper.
    JEE/CBSE papers typically follow a subject-topic ordering.
    """
    topics = {
        "physics": {
            "jee_mains": ["Mechanics", "Electrodynamics", "Optics", "Thermodynamics", "Modern Physics",
                          "Waves", "Magnetism", "Current Electricity", "Gravitation", "Fluid Mechanics"],
            "jee_advanced": ["Mechanics", "Electromagnetic Induction", "Wave Optics", "Thermodynamics",
                             "Nuclear Physics", "Rotational Motion", "Electrostatics", "Alternating Current",
                             "Kinetic Theory", "Photoelectric Effect"],
            "boards_11": ["Laws of Motion", "Work Energy Power", "Thermal Properties", "Oscillations",
                          "Gravitation", "Mechanical Properties", "Kinetic Theory", "Units and Measurement",
                          "Motion in a Plane", "System of Particles"],
            "boards_12": ["Electric Charges", "Current Electricity", "Ray Optics", "Electromagnetic Waves",
                          "Semiconductors", "Magnetism", "AC Circuits", "Dual Nature", "Nuclei", "Communication"],
        },
        "chemistry": {
            "jee_mains": ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Chemical Bonding",
                          "Electrochemistry", "Coordination Compounds", "Thermodynamics", "Equilibrium",
                          "Solutions", "Chemical Kinetics"],
            "jee_advanced": ["Organic Reactions", "Coordination Chemistry", "Chemical Equilibrium",
                             "Thermochemistry", "Polymers", "Aldehydes and Ketones", "Ionic Equilibrium",
                             "Electrochemistry", "Surface Chemistry", "Atomic Structure"],
            "boards_11": ["Atomic Structure", "Chemical Bonding", "States of Matter", "Redox Reactions",
                          "Hydrocarbons", "Thermodynamics", "Equilibrium", "Hydrogen", "s-Block Elements",
                          "Environmental Chemistry"],
            "boards_12": ["Solutions", "Electrochemistry", "Chemical Kinetics", "d-block Elements",
                          "Biomolecules", "Polymers", "Aldehydes Ketones", "Amines", "Haloalkanes",
                          "Coordination Compounds"],
        },
        "mathematics": {
            "jee_mains": ["Calculus", "Algebra", "Coordinate Geometry", "Probability", "Trigonometry",
                          "Vectors", "Matrices", "Complex Numbers", "Sequences and Series", "Statistics"],
            "jee_advanced": ["Differential Equations", "Matrices", "Complex Numbers", "Vectors",
                             "Definite Integrals", "Probability", "Conic Sections", "Functions",
                             "Limits and Continuity", "Permutations"],
            "boards_11": ["Sets and Relations", "Trigonometric Functions", "Sequences and Series",
                          "Straight Lines", "Limits", "Probability", "Binomial Theorem", "Complex Numbers",
                          "Permutations", "Statistics"],
            "boards_12": ["Relations and Functions", "Matrices", "Continuity", "Integrals", "Probability",
                          "Vectors", "Three Dimensional Geometry", "Differential Equations",
                          "Linear Programming", "Applications of Derivatives"],
        },
    }

    subject_topics = topics.get(subject, {}).get(section, ["General"])
    return subject_topics[index % len(subject_topics)]


def assign_difficulty(section: str, index: int) -> str:
    """Assign difficulty based on position (papers get harder as you go)."""
    if section in ("jee_advanced",):
        return ["medium", "medium", "hard"][index % 3]
    elif section in ("jee_mains",):
        return ["easy", "medium", "hard"][index % 3]
    else:
        return ["easy", "easy", "medium"][index % 3]


def process_pdf(
    pdf_path: str,
    section: str,
    subject: str,
    year: int,
    correct_answers: dict[int, str] | None = None,
) -> tuple[list[dict], list[dict]]:
    """
    Main processing pipeline: PDF -> structured questions + answers.
    Returns (questions, answers) tuple.
    """
    print(f"Extracting text from: {pdf_path}", file=sys.stderr)
    raw_text = extract_text(pdf_path)

    if not raw_text.strip():
        print("ERROR: No text could be extracted from the PDF.", file=sys.stderr)
        print("The PDF might be image-based. Try OCR tools first.", file=sys.stderr)
        sys.exit(1)

    print(f"Extracted {len(raw_text)} characters", file=sys.stderr)

    # Detect answer keys from the text
    detected_answers = detect_correct_answers(raw_text, 200)
    if correct_answers:
        detected_answers.update(correct_answers)

    # Split into question blocks
    blocks = split_questions(raw_text)
    print(f"Found {len(blocks)} potential question blocks", file=sys.stderr)

    if not blocks:
        print("ERROR: Could not detect any questions in the PDF.", file=sys.stderr)
        print("The question numbering pattern may be unusual.", file=sys.stderr)
        print("\nExtracted text preview (first 500 chars):", file=sys.stderr)
        print(raw_text[:500], file=sys.stderr)
        sys.exit(1)

    questions = []
    answers = []
    skipped = 0

    for i, block in enumerate(blocks):
        parsed = parse_question_block(block)
        if not parsed:
            skipped += 1
            continue

        # Apply LaTeX conversion
        parsed["question_text"] = math_to_latex(parsed["question_text"])
        for opt in parsed["options"]:
            opt["text"] = math_to_latex(opt["text"])

        q_num = i + 1
        correct = detected_answers.get(q_num, "")

        question = {
            "section": section,
            "subject": subject,
            "topic": assign_topics(subject, section, len(questions), len(blocks)),
            "year": year,
            "question_text": parsed["question_text"],
            "question_images": [],
            "options": parsed["options"],
            "correct_answer": correct,
            "difficulty": assign_difficulty(section, len(questions)),
        }
        questions.append(question)

        answer = {
            "final_answer": correct,
            "approaches": [{
                "title": "Solution",
                "explanation": f"See detailed solution for Q{q_num}.",
                "images": [],
            }],
        }
        answers.append(answer)

    print(f"\nParsed {len(questions)} questions successfully, skipped {skipped}", file=sys.stderr)

    if not correct:
        print(
            "\nWARNING: No answer key detected in the PDF. "
            "correct_answer fields are empty. "
            "You can update them later via the admin panel or mongo-express.",
            file=sys.stderr,
        )

    return questions, answers


def main():
    parser = argparse.ArgumentParser(
        description="Extract MCQ questions from JEE/CBSE PDF papers and output JSON for MongoDB import.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Parse a JEE Mains physics paper
  python3 pdf_importer.py jee_mains_2024_physics.pdf --section jee_mains --subject physics --year 2024

  # Parse with output to file
  python3 pdf_importer.py cbse_12_chemistry.pdf --section boards_12 --subject chemistry --year 2024 -o questions.json

  # Parse and also save answers
  python3 pdf_importer.py paper.pdf --section jee_advanced --subject mathematics --year 2023 -o questions.json --answers-output answers.json

  # After parsing, import to MongoDB:
  go run ./cmd/import/main.go --file questions.json --answers answers.json
        """,
    )
    parser.add_argument("pdf", help="Path to the PDF question paper")
    parser.add_argument("--section", required=True,
                        choices=["jee_mains", "jee_advanced", "boards_11", "boards_12"],
                        help="Exam section")
    parser.add_argument("--subject", required=True,
                        choices=["physics", "chemistry", "mathematics"],
                        help="Subject")
    parser.add_argument("--year", required=True, type=int, help="Exam year")
    parser.add_argument("-o", "--output", default=None,
                        help="Output file for questions JSON (default: stdout)")
    parser.add_argument("--answers-output", default=None,
                        help="Output file for answers JSON")
    parser.add_argument("--preview", action="store_true",
                        help="Show extracted text preview without parsing")

    args = parser.parse_args()

    pdf_path = args.pdf
    if not Path(pdf_path).exists():
        print(f"ERROR: File not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    if args.preview:
        text = extract_text(pdf_path)
        print(text[:3000])
        print(f"\n... ({len(text)} total characters)")
        return

    questions, answers = process_pdf(pdf_path, args.section, args.subject, args.year)

    # Output questions
    questions_json = json.dumps(questions, indent=2, ensure_ascii=False)
    if args.output:
        Path(args.output).write_text(questions_json)
        print(f"Questions written to: {args.output}", file=sys.stderr)
    else:
        print(questions_json)

    # Output answers if requested
    if args.answers_output:
        answers_json = json.dumps(answers, indent=2, ensure_ascii=False)
        Path(args.answers_output).write_text(answers_json)
        print(f"Answers written to: {args.answers_output}", file=sys.stderr)

    # Summary
    print(f"\n--- Summary ---", file=sys.stderr)
    print(f"Section:    {args.section}", file=sys.stderr)
    print(f"Subject:    {args.subject}", file=sys.stderr)
    print(f"Year:       {args.year}", file=sys.stderr)
    print(f"Questions:  {len(questions)}", file=sys.stderr)
    has_answers = sum(1 for q in questions if q["correct_answer"])
    print(f"With answers: {has_answers}/{len(questions)}", file=sys.stderr)


if __name__ == "__main__":
    main()
