from utils.audio_processor import AudioProcessor


def test_clean_transcript_empty():
    assert AudioProcessor.clean_transcript("") == ""
    assert AudioProcessor.clean_transcript(None) == ""


def test_clean_transcript_formatting():
    assert AudioProcessor.clean_transcript("  hello world  ") == "Hello world"
    assert AudioProcessor.clean_transcript("python developer") == "Python developer"
