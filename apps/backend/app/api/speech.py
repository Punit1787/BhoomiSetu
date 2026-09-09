from pathlib import Path
from subprocess import CalledProcessError, TimeoutExpired, run
from tempfile import TemporaryDirectory
from threading import BoundedSemaphore
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field, field_validator
from starlette.concurrency import run_in_threadpool

from app.core.dependencies import get_current_user
from app.models import User

router = APIRouter(tags=["accessibility"])
_slots = BoundedSemaphore(2)


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=600)
    locale: Literal["en", "hi", "mr", "gu", "kn"] = "en"

    @field_validator("text")
    @classmethod
    def nonempty_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Text must not be blank")
        return value.strip()


def synthesize(payload: SpeechRequest) -> bytes:
    if not _slots.acquire(blocking=False):
        raise HTTPException(429, "Audio is busy. Please try again shortly.")
    try:
        with TemporaryDirectory(prefix="bhoomisetu-speech-") as directory:
            path = Path(directory) / "speech.wav"
            run(
                ["espeak-ng", "-v", payload.locale, "-s", "150", "-w", str(path), "--stdin"],
                input=payload.text.encode("utf-8"),
                capture_output=True,
                timeout=10,
                check=True,
            )
            return path.read_bytes()
    except (FileNotFoundError, CalledProcessError, TimeoutExpired) as exc:
        raise HTTPException(503, "Audio is unavailable right now. Please try again.") from exc
    finally:
        _slots.release()


@router.post("/accessibility/speech")
async def speech(payload: SpeechRequest, _: User = Depends(get_current_user)) -> Response:
    audio = await run_in_threadpool(synthesize, payload)
    return Response(audio, media_type="audio/wav", headers={"Cache-Control": "no-store"})
