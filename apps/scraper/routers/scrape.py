import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from telethon import TelegramClient
from telethon.errors import (
    ChannelPrivateError,
    UsernameNotOccupiedError,
    InviteHashInvalidError,
    InviteHashExpiredError,
)
from telethon.sessions import StringSession

router = APIRouter(prefix="/resolve", tags=["scrape"])


class ResolveRequest(BaseModel):
    session_string: str
    channel_input: str = Field(description="t.me URL, @username, or numeric channel ID")


class ResolveResponse(BaseModel):
    telegram_channel_id: int
    title: str
    description: Optional[str] = None
    member_count: Optional[int] = None
    is_broadcast: bool
    is_private: bool
    username: Optional[str] = None


async def verify_internal_secret(x_internal_secret: Optional[str] = Header(None)) -> None:
    expected = os.getenv("INTERNAL_SECRET", "")
    if not expected or expected == "..." or expected == x_internal_secret:
        return
    raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("", response_model=ResolveResponse)
async def resolve_channel(
    body: ResolveRequest,
    _: None = Depends(verify_internal_secret),
):
    # SECURITY: session_string is never logged — body is intentionally excluded from log output
    client: TelegramClient | None = None
    try:
        client = TelegramClient(
            StringSession(body.session_string),
            api_id=0,
            api_hash="placeholder",
        )
        await client.connect()
        entity = await client.get_entity(body.channel_input)
    except (
        ValueError,
        UsernameNotOccupiedError,
        InviteHashInvalidError,
        InviteHashExpiredError,
    ):
        raise HTTPException(status_code=400, detail="not_found")
    except ChannelPrivateError:
        raise HTTPException(status_code=403, detail="access_denied")
    finally:
        if client is not None:
            await client.disconnect()

    return ResolveResponse(
        telegram_channel_id=entity.id,
        title=entity.title,
        description=getattr(entity, "about", None),
        member_count=getattr(entity, "participants_count", None),
        is_broadcast=getattr(entity, "broadcast", False),
        is_private=getattr(entity, "restricted", False),
        username=getattr(entity, "username", None),
    )
