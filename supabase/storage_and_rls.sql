-- ==========================================================
-- CaisterPlayz — Row Level Security (RLS) & Storage Policies
-- ==========================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
-- Anyone can view profiles (unless blocked)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (
    NOT EXISTS (
        SELECT 1 FROM public.blocks 
        WHERE (blocker_id = auth.uid() AND blocked_id = profiles.id)
           OR (blocker_id = profiles.id AND blocked_id = auth.uid())
    )
);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. POSTS POLICIES
-- Anyone can view posts not authored by blocked users
CREATE POLICY "Posts viewable by everyone except blocked users" 
ON public.posts FOR SELECT 
USING (
    NOT EXISTS (
        SELECT 1 FROM public.blocks 
        WHERE (blocker_id = auth.uid() AND blocked_id = posts.user_id)
           OR (blocker_id = posts.user_id AND blocked_id = auth.uid())
    )
);

-- Authenticated users can insert their own posts
CREATE POLICY "Users can insert own posts" 
ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update own posts
CREATE POLICY "Users can update own posts" 
ON public.posts FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete own posts
CREATE POLICY "Users can delete own posts" 
ON public.posts FOR DELETE 
USING (auth.uid() = user_id);

-- 3. POST MEDIA POLICIES
CREATE POLICY "Post media viewable with post" 
ON public.post_media FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_media.post_id
    )
);

CREATE POLICY "Users can insert media for own posts" 
ON public.post_media FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_media.post_id AND posts.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete media for own posts" 
ON public.post_media FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_media.post_id AND posts.user_id = auth.uid()
    )
);

-- 4. LIKES POLICIES
CREATE POLICY "Likes are viewable by everyone" 
ON public.likes FOR SELECT 
USING (TRUE);

CREATE POLICY "Users can insert own likes" 
ON public.likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" 
ON public.likes FOR DELETE 
USING (auth.uid() = user_id);

-- 5. COMMENTS POLICIES
CREATE POLICY "Comments viewable by everyone except blocked users" 
ON public.comments FOR SELECT 
USING (
    NOT EXISTS (
        SELECT 1 FROM public.blocks 
        WHERE (blocker_id = auth.uid() AND blocked_id = comments.user_id)
           OR (blocker_id = comments.user_id AND blocked_id = auth.uid())
    )
);

CREATE POLICY "Users can insert own comments" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments or comments on own posts" 
ON public.comments FOR DELETE 
USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.posts WHERE posts.id = comments.post_id AND posts.user_id = auth.uid())
);

-- 6. FOLLOWS POLICIES
CREATE POLICY "Follows viewable by everyone" 
ON public.follows FOR SELECT 
USING (TRUE);

CREATE POLICY "Users can follow other users" 
ON public.follows FOR INSERT 
WITH CHECK (
    auth.uid() = follower_id AND 
    NOT EXISTS (
        SELECT 1 FROM public.blocks 
        WHERE (blocker_id = follower_id AND blocked_id = following_id)
           OR (blocker_id = following_id AND blocked_id = follower_id)
    )
);

CREATE POLICY "Users can unfollow" 
ON public.follows FOR DELETE 
USING (auth.uid() = follower_id);

-- 7. BLOCKS POLICIES
CREATE POLICY "Users can view their own blocks" 
ON public.blocks FOR SELECT 
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block other users" 
ON public.blocks FOR INSERT 
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock users" 
ON public.blocks FOR DELETE 
USING (auth.uid() = blocker_id);

-- 8. REPORTS POLICIES
CREATE POLICY "Authenticated users can submit reports" 
ON public.reports FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own filed reports" 
ON public.reports FOR SELECT 
USING (auth.uid() = reporter_id);

-- 9. CONVERSATIONS & CONVERSATION MEMBERS
CREATE POLICY "Members can view their conversations" 
ON public.conversations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members 
        WHERE conversation_members.conversation_id = conversations.id 
          AND conversation_members.user_id = auth.uid()
    )
);

CREATE POLICY "Authenticated users can create conversations" 
ON public.conversations FOR INSERT 
WITH CHECK (TRUE);

CREATE POLICY "Members can view conversation members" 
ON public.conversation_members FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members AS cm
        WHERE cm.conversation_id = conversation_members.conversation_id 
          AND cm.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert members" 
ON public.conversation_members FOR INSERT 
WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM public.conversation_members 
        WHERE conversation_members.conversation_id = conversation_members.conversation_id 
          AND conversation_members.user_id = auth.uid()
    )
);

-- 10. MESSAGES POLICIES
CREATE POLICY "Conversation members can view messages" 
ON public.messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members 
        WHERE conversation_members.conversation_id = messages.conversation_id 
          AND conversation_members.user_id = auth.uid()
    ) AND NOT EXISTS (
        SELECT 1 FROM public.blocks 
        WHERE (blocker_id = auth.uid() AND blocked_id = messages.sender_id)
           OR (blocker_id = messages.sender_id AND blocked_id = auth.uid())
    )
);

CREATE POLICY "Conversation members can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversation_members 
        WHERE conversation_members.conversation_id = messages.conversation_id 
          AND conversation_members.user_id = auth.uid()
    ) AND NOT EXISTS (
        SELECT 1 FROM public.blocks 
        JOIN public.conversation_members cm ON cm.conversation_id = messages.conversation_id
        WHERE (blocks.blocker_id = cm.user_id AND blocks.blocked_id = auth.uid())
           OR (blocks.blocker_id = auth.uid() AND blocks.blocked_id = cm.user_id)
    )
);

-- 11. NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = recipient_id);

-- 12. ACHIEVEMENTS POLICIES
CREATE POLICY "Achievements viewable by everyone" 
ON public.achievements FOR SELECT 
USING (TRUE);

CREATE POLICY "User achievements viewable by everyone" 
ON public.user_achievements FOR SELECT 
USING (TRUE);

-- ==========================================================
-- STORAGE BUCKETS & STORAGE RLS POLICIES
-- ==========================================================

-- Note: Storage buckets 'avatars', 'banners', 'posts' should be created in Supabase Storage.
-- Below are the storage RLS definitions for storage.objects:

-- Avatars: Public read, owner insert/update/delete
-- storage.objects insert:
-- bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid
-- storage.objects select:
-- bucket_id = 'avatars'

-- Banners: Public read, owner insert/update/delete
-- bucket_id = 'banners' AND auth.uid() = (storage.foldername(name))[1]::uuid

-- Posts: Public read (images and video clips), owner insert/delete
-- bucket_id = 'posts' AND auth.uid() = (storage.foldername(name))[1]::uuid
