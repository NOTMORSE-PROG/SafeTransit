// My Posts Screen
// User's posts management page

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, Flag } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { FlairBadge } from '@/components/forum/FlairBadge';
import { getPosts, deletePost, type ForumPostWithAuthor } from '@/services/forumService';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return 'Just now';
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'visible':
      return { Icon: Eye, color: '#16a34a', label: 'Visible' };
    case 'hidden':
      return { Icon: EyeOff, color: '#dc2626', label: 'Hidden (Low Votes)' };
    case 'flagged':
      return { Icon: Flag, color: '#f59e0b', label: 'Flagged for Review' };
    default:
      return { Icon: Eye, color: '#6b7280', label: status };
  }
}

export default function MyPosts() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

  const [posts, setPosts] = useState<ForumPostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async (showRefresh = false) => {
    if (!token || !user) return;

    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const response = await getPosts({
        authorId: user.id,
        token,
        limit: 50,
      });

      setPosts(response.data);
    } catch (err) {
      console.error('Failed to load posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleDelete = (postId: string, postTitle: string) => {
    Alert.alert(
      'Delete Post',
      `Are you sure you want to delete "${postTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            setDeletingPostId(postId);
            try {
              await deletePost(postId, token);
              setPosts((prev) => prev.filter((p) => p.id !== postId));
              Alert.alert('Success', 'Post deleted successfully');
            } catch {
              Alert.alert('Error', 'Failed to delete post');
            } finally {
              setDeletingPostId(null);
            }
          },
        },
      ]
    );
  };

  if (!user || !token) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-xl font-bold text-neutral-900 mb-2">Sign In Required</Text>
        <Text className="text-neutral-600 text-center mb-6">
          You need to be signed in to manage your posts.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/auth/login')}
          className="bg-primary-600 px-8 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 pb-4 border-b border-neutral-100 bg-white"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft color="#374151" size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-neutral-900">My Posts</Text>
        <TouchableOpacity
          onPress={() => router.push('/create-post' as never)}
          className="p-2"
        >
          <Plus color="#2563eb" size={24} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadPosts(true)} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : error ? (
          <View className="items-center justify-center py-20">
            <Text className="text-danger-600 mb-4">{error}</Text>
            <TouchableOpacity
              onPress={() => loadPosts()}
              className="bg-primary-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : posts.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-neutral-500 text-base mb-4">You haven't created any posts yet</Text>
            <TouchableOpacity
              onPress={() => router.push('/create-post' as never)}
              className="bg-primary-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Create Your First Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post, index) => {
            const status = getStatusIcon(post.status);
            const isDeleting = deletingPostId === post.id;

            return (
              <Animated.View
                key={post.id}
                entering={FadeInDown.delay(index * 50).duration(400)}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/post-detail?id=${post.id}` as never)}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-soft"
                  activeOpacity={0.7}
                  disabled={isDeleting}
                >
                  {/* Header: Flair + Status */}
                  <View className="flex-row items-center justify-between mb-2">
                    <FlairBadge flair={post.flair} size="sm" />
                    <View className="flex-row items-center">
                      <status.Icon color={status.color} size={14} strokeWidth={2} />
                      <Text className="text-xs font-medium ml-1" style={{ color: status.color }}>
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text className="text-base font-bold text-neutral-900 mb-1" numberOfLines={2}>
                    {post.title}
                  </Text>

                  {/* Stats */}
                  <View className="flex-row items-center mt-2">
                    <Text className="text-xs text-neutral-500 mr-3">
                      {formatTimeAgo(post.created_at)}
                    </Text>
                    <Text className="text-xs text-neutral-500 mr-3">
                      {post.upvotes} votes
                    </Text>
                    <Text className="text-xs text-neutral-500">
                      {post.comment_count} comments
                    </Text>
                  </View>

                  {/* Actions */}
                  <View className="flex-row items-center justify-end mt-3 border-t border-neutral-100 pt-3">
                    <TouchableOpacity
                      className="p-2 mr-2"
                      onPress={() => router.push(`/create-post?id=${post.id}` as never)}
                    >
                      <Edit2 color="#4b5563" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="p-2"
                      onPress={() => handleDelete(post.id, post.title)}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color="#dc2626" />
                      ) : (
                        <Trash2 color="#dc2626" size={18} />
                      )}
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
