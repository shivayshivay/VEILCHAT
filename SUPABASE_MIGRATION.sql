-- ============================================================
--  VEILCHAT — Supabase schema migration
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── users ────────────────────────────────────────────────────────────────────
-- Mirrors the users inserted by the API server on registration.

CREATE TABLE IF NOT EXISTS public.users (
  id            TEXT        PRIMARY KEY,   -- Firebase UID / JWT sub
  name          TEXT        NOT NULL DEFAULT '',
  phone         TEXT,
  email         TEXT,
  avatar_color  TEXT        NOT NULL DEFAULT '#00F5D4',
  avatar_url    TEXT,
  is_online     BOOLEAN     NOT NULL DEFAULT false,
  is_verified   BOOLEAN     NOT NULL DEFAULT false,
  status        TEXT        NOT NULL DEFAULT 'active',  -- 'active' | 'suspended'
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── conversations ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.conversations (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  last_message_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_text       TEXT,
  last_message_sender_id  TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── conversation_members ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id  UUID        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id          TEXT        NOT NULL,
  display_name     TEXT,
  avatar_color     TEXT        DEFAULT '#00F5D4',
  avatar_url       TEXT,
  last_read_at     TIMESTAMPTZ,
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_members_user
  ON public.conversation_members (user_id);

CREATE INDEX IF NOT EXISTS idx_conv_members_conv
  ON public.conversation_members (conversation_id);

-- ─── messages ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id        TEXT        NOT NULL,
  sender_name      TEXT,
  text             TEXT,
  type             TEXT        NOT NULL DEFAULT 'text',  -- 'text'|'image'|'video'|'audio'|'file'|'location'
  media_url        TEXT,
  reply_to_id      UUID        REFERENCES public.messages(id) ON DELETE SET NULL,
  reply_to_text    TEXT,
  status           TEXT        NOT NULL DEFAULT 'sent',  -- 'sent'|'delivered'|'read'|'failed'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON public.messages (sender_id);

-- ─── message_reactions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.message_reactions (
  message_id  UUID  NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id     TEXT  NOT NULL,
  emoji       TEXT  NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

-- ─── Realtime publication ─────────────────────────────────────────────────────
-- Required for Supabase postgres_changes to work on these tables.

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Required for realtime INSERT to include the full row payload:
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

-- ─── Row Level Security (disabled for development) ────────────────────────────
-- Enable & add policies before going to production.

ALTER TABLE public.users               DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions   DISABLE ROW LEVEL SECURITY;

-- ─── Helpful function: upsert user on login ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.upsert_user(
  p_id           TEXT,
  p_name         TEXT,
  p_phone        TEXT DEFAULT NULL,
  p_email        TEXT DEFAULT NULL,
  p_avatar_color TEXT DEFAULT '#00F5D4'
)
RETURNS public.users
LANGUAGE plpgsql
AS $$
DECLARE
  v_user public.users;
BEGIN
  INSERT INTO public.users (id, name, phone, email, avatar_color, updated_at)
  VALUES (p_id, p_name, p_phone, p_email, p_avatar_color, now())
  ON CONFLICT (id) DO UPDATE
    SET name         = EXCLUDED.name,
        phone        = COALESCE(EXCLUDED.phone, public.users.phone),
        email        = COALESCE(EXCLUDED.email, public.users.email),
        avatar_color = EXCLUDED.avatar_color,
        updated_at   = now()
  RETURNING * INTO v_user;
  RETURN v_user;
END;
$$;
