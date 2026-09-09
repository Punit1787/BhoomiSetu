import io
import shutil
import uuid
import wave

import pytest

from app.api.speech import SpeechRequest, synthesize
from tests.test_phase_one_api import authorization, register


@pytest.mark.skipif(shutil.which("espeak-ng") is None, reason="eSpeak NG is installed in Docker/CI")
@pytest.mark.parametrize(
    "locale,text",
    [
        ("en", "Your documents are being verified."),
        ("hi", "आपके दस्तावेज़ों का सत्यापन चल रहा है।"),
        ("mr", "तुमच्या कागदपत्रांची पडताळणी सुरू आहे."),
        ("gu", "તમારા દસ્તાવેજોની ચકાસણી ચાલી રહી છે."),
        ("kn", "ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ."),
    ],
)
def test_generated_audio_is_playable_in_each_language(locale, text):
    audio = synthesize(SpeechRequest(text=text, locale=locale))
    with wave.open(io.BytesIO(audio)) as sound:
        assert sound.getnchannels() == 1
        assert sound.getframerate() > 0
        assert sound.getnframes() > sound.getframerate()  # At least one second.
        assert any(sound.readframes(sound.getnframes()))


def test_speech_requires_login_and_limits_input(client, monkeypatch):
    assert client.post("/accessibility/speech", json={"text": "Hello"}).status_code == 403
    account = register(client, "landowner", uuid.uuid4().hex)
    headers = authorization(account)
    assert (
        client.post("/accessibility/speech", headers=headers, json={"text": "x" * 601}).status_code
        == 422
    )
    assert (
        client.post(
            "/accessibility/speech", headers=headers, json={"text": "Hello", "locale": "invalid"}
        ).status_code
        == 422
    )
    monkeypatch.setattr("app.api.speech.synthesize", lambda payload: b"RIFF-test-audio")
    result = client.post("/accessibility/speech", headers=headers, json={"text": "Hello"})
    assert result.status_code == 200
    assert result.headers["content-type"] == "audio/wav"
    assert result.headers["cache-control"] == "no-store"
