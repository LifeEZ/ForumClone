# Hiver

A community discussion platform where people join topic-based groups, share posts, discuss in threads, and vote on content.

## Language

**Community**:
A topic-based group that owns a feed of posts. Identified by a unique short name used in URLs (e.g. `films` → `/c/films`). Any user may create a community; the creator becomes its first member.
_Avoid_: Subreddit, forum, channel

**Member**:
A user who has joined a community. Membership is required to post there; guests and non-members may still read public community pages.
_Avoid_: Subscriber, follower

**Post**:
A piece of content submitted to a community — title plus optional body, link, or image.
_Avoid_: Thread, submission

**Comment**:
A reply on a post. Comments can nest under other comments to form a thread, up to 10 levels deep.
_Avoid_: Reply (as a noun for the entity), message

**Deletion**:
Removing content authored by the user who created it. The record is kept but content is replaced with a `[deleted]` placeholder; replies and thread structure remain.
_Avoid_: Hard delete, remove, hide

**Vote**:
A user's up or down rating on a post or comment. One vote per user per target; can be changed or removed.
_Avoid_: Like, reaction, rating

**Score**:
The net vote count on a post or comment (upvotes minus downvotes).
_Avoid_: Karma (score is per-item; karma is per-user)

**Karma**:
A user's accumulated standing across the platform, derived from votes received on their posts and comments.
_Avoid_: Reputation, points

**User**:
A person with a registered account on Hiver — username, email, and profile. Distinct from a guest and from a seed author.
_Avoid_: Member (member implies community membership), account

**Feed**:
An ordered list of posts sorted newest-first in v1.
_Avoid_: Timeline, stream

**Home feed**:
The feed on the main page for a logged-in member — posts from communities they have joined. Falls back to the global feed when the member has no joins yet.
_Avoid_: Dashboard, main timeline

**Global feed**:
The feed shown to guests (and as fallback when a member has no joins) — posts from across all communities.
_Avoid_: Popular feed, explore feed

**Guest**:
A visitor who is not logged in. Guests may read public content; voting, posting, commenting, and joining require an account.
_Avoid_: Anonymous user, visitor (as the canonical term)

**Seed content**:
Starter communities, posts, and comments pre-loaded for demo purposes — not created by real members. Seed authors are display-only accounts, not login-able users.
_Avoid_: Fixture data, mock data, sample data
