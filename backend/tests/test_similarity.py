"""
Part 5 validation: 10-pair evaluation harness for the novelty scorer.

This MUST be run and reviewed before wiring similarity.py into the
orchestrator. Each pair has an expected direction (high overlap / low
overlap) — we're checking the scorer discriminates correctly, not that
it hits an exact number.

Run with: pytest tests/test_similarity.py -v -s
(the -s flag prints the actual scores so you can eyeball them)
"""
import pytest

from app.schemas import SourceItem
from app.services.similarity import compute_novelty

# Each tuple: (idea_text, existing_work, expected_low_novelty)
# expected_low_novelty=True means we expect HIGH overlap / LOW novelty score
# expected_low_novelty=False means we expect LOW overlap / HIGH novelty score
EVAL_PAIRS = [
    ("A photo-sharing app for pets, similar to Instagram but for animals",
     "Instagram - share photos and videos with friends and followers", True),
    ("A clone of Twitter for short text posts and a public timeline",
     "Twitter/X - a social network for short-form public posts", True),
    ("An app that recommends recipes based on a photo of your fridge",
     "fridge-chef: suggests recipes from a photo of your fridge using CV", True),
    ("A ride-sharing app connecting drivers and riders in real time",
     "Uber - on-demand ride-sharing platform connecting drivers and riders", True),
    ("A note-taking app with markdown support and folders",
     "Notion - markdown-based notes, docs, and folder organization", True),
    ("A tool that predicts crop yield for smallholder farmers in drought-prone "
     "regions using satellite soil-moisture data and hyperlocal weather forecasts",
     "A general-purpose weather forecasting mobile app for the public", False),
    ("A marketplace for renting specialized scientific lab equipment between "
     "university research labs to reduce idle equipment costs",
     "Airbnb - marketplace for renting spare rooms and homes", False),
    ("A tool for musicians to co-compose using generative AI trained specifically "
     "on microtonal and non-Western tuning systems",
     "A generic AI music generation tool using standard 12-tone equal temperament", False),
    ("An accessibility tool converting sign language video into real-time captions "
     "for factory-floor safety announcements",
     "A general video captioning tool for YouTube videos", False),
    ("A supply-chain traceability system for small-batch coffee farmers using "
     "blockchain receipts verified at each roasting stage",
     "A generic blockchain ledger tutorial project", False),
]


@pytest.mark.parametrize("idea_text,existing_summary,expected_low_novelty", EVAL_PAIRS)
def test_novelty_direction(idea_text, existing_summary, expected_low_novelty):
    source = SourceItem(
        source_type="github", title="existing-work",
        url="https://example.com/existing", summary=existing_summary,
    )
    result = compute_novelty(idea_text, [source])
    print(f"\nIdea: {idea_text[:60]}...\n  -> novelty_score={result.novelty_score}")

    if expected_low_novelty:
        assert result.novelty_score < 50, (
            f"Expected LOW novelty (high overlap) but got {result.novelty_score}"
        )
    else:
        assert result.novelty_score >= 50, (
            f"Expected HIGH novelty (low overlap) but got {result.novelty_score}"
        )


def test_report_overall_accuracy():
    """Run all 10 pairs and print a summary accuracy number.
    This is the number to look at before approving Part 5 as done."""
    correct = 0
    for idea_text, existing_summary, expected_low_novelty in EVAL_PAIRS:
        source = SourceItem(
            source_type="github", title="existing-work",
            url="https://example.com/existing", summary=existing_summary,
        )
        result = compute_novelty(idea_text, [source])
        predicted_low = result.novelty_score < 50
        if predicted_low == expected_low_novelty:
            correct += 1

    accuracy = correct / len(EVAL_PAIRS)
    print(f"\n\n=== Novelty scorer accuracy: {correct}/{len(EVAL_PAIRS)} ({accuracy:.0%}) ===\n")
    assert accuracy >= 0.7, (
        f"Accuracy {accuracy:.0%} is below the 70% bar — tune the scorer before proceeding."
    )
