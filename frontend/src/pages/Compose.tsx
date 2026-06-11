import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
export const Compose: React.FC = () => {
  const navigate = useNavigate();
  const { communities, addPost } = useAppContext();
  const joinedCommunities = communities.filter((c) => c.isJoined);
  const [communityId, setCommunityId] = useState(joinedCommunities[0]?.id || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !communityId) return;
    const newPostId = addPost({
      communityId,
      title: title.trim(),
      content: content.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined
    });
    navigate(`/post/${newPostId}`);
  };
  if (joinedCommunities.length === 0) {
    return (
      <div className="text-center py-20 bg-forest-surface border border-forest-border rounded-2xl">
        <h2 className="text-xl font-bold text-forest-text mb-2">
          Join a community first
        </h2>
        <p className="text-forest-muted mb-6">
          You need to join at least one community to post.
        </p>
        <button
          onClick={() => navigate('/explore')}
          className="px-6 py-2 rounded-xl font-semibold bg-forest-accent text-white hover:bg-forest-accent-hover transition-colors">
          
          Explore Communities
        </button>
      </div>);

  }
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-forest-text mb-6">
        Create a post
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-forest-surface border border-forest-border rounded-2xl p-4 sm:p-6">
        
        <div className="mb-6">
          <label className="block text-sm font-semibold text-forest-text mb-2">
            Select a community
          </label>
          <select
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
            className="w-full sm:w-1/2 bg-forest-bg border border-forest-border rounded-xl p-3 text-forest-text focus:outline-none focus:border-forest-accent focus:ring-1 focus:ring-forest-accent appearance-none">
            
            {joinedCommunities.map((c) =>
            <option key={c.id} value={c.id}>
                r/{c.handle}
              </option>
            )}
          </select>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            maxLength={300}
            className="w-full bg-forest-bg border border-forest-border rounded-xl p-4 text-lg font-semibold text-forest-text placeholder:text-forest-muted focus:outline-none focus:border-forest-accent focus:ring-1 focus:ring-forest-accent"
            required />
          
        </div>

        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Body (optional)"
            className="w-full bg-forest-bg border border-forest-border rounded-xl p-4 text-forest-text placeholder:text-forest-muted focus:outline-none focus:border-forest-accent focus:ring-1 focus:ring-forest-accent resize-none min-h-[150px]" />
          
        </div>

        {showImageInput ?
        <div className="mb-6 flex items-center gap-2">
            <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL (optional)"
            className="flex-1 bg-forest-bg border border-forest-border rounded-xl p-3 text-forest-text placeholder:text-forest-muted focus:outline-none focus:border-forest-accent focus:ring-1 focus:ring-forest-accent" />
          
            <button
            type="button"
            onClick={() => {
              setShowImageInput(false);
              setImageUrl('');
            }}
            className="p-3 text-forest-muted hover:text-forest-text hover:bg-forest-bg rounded-xl transition-colors">
            
              <X className="w-5 h-5" />
            </button>
          </div> :

        <div className="mb-6">
            <button
            type="button"
            onClick={() => setShowImageInput(true)}
            className="flex items-center gap-2 text-sm font-medium text-forest-muted hover:text-forest-text transition-colors">
            
              <ImageIcon className="w-5 h-5" />
              Add Image URL
            </button>
          </div>
        }

        <div className="flex justify-end gap-3 pt-4 border-t border-forest-border">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-xl font-semibold text-forest-text hover:bg-forest-bg transition-colors">
            
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !communityId}
            className="px-6 py-2 rounded-xl font-semibold bg-forest-accent text-white hover:bg-forest-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            
            Post
          </button>
        </div>
      </form>
    </div>);

};