// Community Forum Screen
// Main forum feed with posts, filtering, and sorting

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  AppState,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Search,
  Plus,
  Filter,
  TrendingUp,
  Clock,
  SearchX,
  ArrowUp,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { ForumPostCard } from "@/components/forum/ForumPostCard";
import {
  getPosts,
  votePost,
  type ForumPostWithAuthor,
  type PostFlair,
} from "@/services/forumService";
import { FLAIR_CONFIG } from "@/services/types/forum";

const FLAIRS: (PostFlair | "all")[] = [
  "all",
  "general",
  "routes",
  "questions",
  "experiences",
  "tips_advice",
];

export default function Community() {
  const router = useRouter();
  const { token } = useAuth();

  const [posts, setPosts] = useState<ForumPostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFlair, setSelectedFlair] = useState<PostFlair | "all">("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [votingPostId, setVotingPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newPostsAvailable, setNewPostsAvailable] = useState<
    ForumPostWithAuthor[]
  >([]);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);

  const loadPosts = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) setIsRefreshing(true);
        else setIsLoading(true);
        setError(null);

        const response = await getPosts({
          sort: sortBy,
          flair: selectedFlair === "all" ? undefined : selectedFlair,
          token: token || undefined,
        });

        setPosts(response.data);
        setShowNewPostsBanner(false);
        setNewPostsAvailable([]);
      } catch (err) {
        console.error("Failed to load posts:", err);
        setError(err instanceof Error ? err.message : "Failed to load posts");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [sortBy, selectedFlair, token],
  );

  const checkForNewPosts = useCallback(async () => {
    try {
      const response = await getPosts({
        sort: sortBy,
        flair: selectedFlair === "all" ? undefined : selectedFlair,
        token: token || undefined,
      });

      const newPosts = response.data.filter(
        (newPost) => !posts.some((existingPost) => existingPost.id === newPost.id),
      );

      if (newPosts.length > 0) {
        setNewPostsAvailable(newPosts);
        setShowNewPostsBanner(true);
      }
    } catch (err) {
      console.error("Silent refresh failed:", err);
    }
  }, [sortBy, selectedFlair, token, posts]);

  const applyNewPosts = () => {
    setPosts((prev) => [...newPostsAvailable, ...prev]);
    setNewPostsAvailable([]);
    setShowNewPostsBanner(false);
  };

  // Load posts when filters change
  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPosts, sortBy, searchQuery]);

  // Facebook-style silent refresh with AppState monitoring
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          checkForNewPosts();
        }
      },
    );

    const intervalId = setInterval(() => {
      if (
        AppState.currentState === "active" &&
        !isLoading &&
        !isRefreshing
      ) {
        checkForNewPosts();
      }
    }, 30000); // 30 seconds

    return () => {
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  }, [isLoading, isRefreshing, checkForNewPosts]);

  const handleVote = async (postId: string, voteType: "up" | "down") => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    setVotingPostId(postId);
    try {
      const result = await votePost(postId, voteType, token);
      if (result.success) {
        // Optimistically update the UI
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id !== postId) return post;

            const wasUpvoted = post.user_vote === "up";
            const wasDownvoted = post.user_vote === "down";
            const newVote = result.data?.newVote;

            let upvotes = post.upvotes;
            let downvotes = post.downvotes;

            // Adjust counts based on vote change
            if (wasUpvoted) upvotes--;
            if (wasDownvoted) downvotes--;
            if (newVote === "up") upvotes++;
            if (newVote === "down") downvotes++;

            return { ...post, upvotes, downvotes, user_vote: newVote };
          }),
        );
      }
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setVotingPostId(null);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.body.toLowerCase().includes(query) ||
      post.author_name.toLowerCase().includes(query)
    );
  });

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View className="bg-white pt-14 pb-4 px-6 border-b border-neutral-100">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-3xl font-bold text-neutral-900">Community</Text>
          {/* New Post FAB */}
          <TouchableOpacity
            onPress={() => router.push("/create-post" as never)}
            className="bg-primary-600 w-10 h-10 rounded-full items-center justify-center shadow-medium"
            activeOpacity={0.8}
            accessibilityLabel="Create new post"
            accessibilityRole="button"
          >
            <Plus color="#fff" size={24} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="bg-neutral-100 rounded-xl px-4 py-3 flex-row items-center mb-4">
          <Search color="#6b7280" size={20} strokeWidth={2} />
          <TextInput
            placeholder="Search posts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-base text-neutral-900 ml-2"
            placeholderTextColor="#9CA3AF"
            accessible={true}
            accessibilityLabel="Search forum posts"
          />
        </View>

        {/* Sort Toggle */}
        <View className="flex-row items-center mb-3">
          <TouchableOpacity
            onPress={() => setSortBy("recent")}
            className={`flex-row items-center px-3 py-2 rounded-lg mr-2 ${
              sortBy === "recent" ? "bg-primary-100" : "bg-neutral-100"
            }`}
            activeOpacity={0.7}
          >
            <Clock
              color={sortBy === "recent" ? "#2563eb" : "#6b7280"}
              size={16}
              strokeWidth={2}
            />
            <Text
              className={`text-sm font-medium ml-1.5 ${
                sortBy === "recent" ? "text-primary-600" : "text-neutral-600"
              }`}
            >
              Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortBy("popular")}
            className={`flex-row items-center px-3 py-2 rounded-lg ${
              sortBy === "popular" ? "bg-primary-100" : "bg-neutral-100"
            }`}
            activeOpacity={0.7}
          >
            <TrendingUp
              color={sortBy === "popular" ? "#2563eb" : "#6b7280"}
              size={16}
              strokeWidth={2}
            />
            <Text
              className={`text-sm font-medium ml-1.5 ${
                sortBy === "popular" ? "text-primary-600" : "text-neutral-600"
              }`}
            >
              Popular
            </Text>
          </TouchableOpacity>
        </View>

        {/* Flair Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row -mx-6 px-6"
        >
          {FLAIRS.map((flair) => (
            <TouchableOpacity
              key={flair}
              onPress={() => setSelectedFlair(flair)}
              className={`mr-2 px-3 py-2 rounded-full ${
                selectedFlair === flair ? "bg-primary-600" : "bg-neutral-200"
              }`}
              activeOpacity={0.7}
            >
              {flair === "all" ? (
                <View className="flex-row items-center">
                  <Filter
                    color={selectedFlair === "all" ? "#fff" : "#374151"}
                    size={14}
                    strokeWidth={2}
                  />
                  <Text
                    className={`text-sm font-medium ml-1.5 ${
                      selectedFlair === "all"
                        ? "text-white"
                        : "text-neutral-700"
                    }`}
                  >
                    All
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Text className="text-sm mr-1">
                    {FLAIR_CONFIG[flair].emoji}
                  </Text>
                  <Text
                    className={`text-sm font-medium ${
                      selectedFlair === flair
                        ? "text-white"
                        : "text-neutral-700"
                    }`}
                  >
                    {FLAIR_CONFIG[flair].label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* New Posts Available Banner */}
      {showNewPostsBanner && (
        <TouchableOpacity
          onPress={applyNewPosts}
          className="absolute top-0 left-4 right-4 z-50 bg-primary-600 rounded-b-xl px-4 py-3 flex-row items-center justify-center shadow-lg"
          style={{ marginTop: 0 }}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center">
            <ArrowUp color="#fff" size={18} strokeWidth={2} />
            <Text className="text-white font-semibold ml-2">
              {newPostsAvailable.length} new{" "}
              {newPostsAvailable.length === 1 ? "post" : "posts"}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Posts List */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadPosts(true)}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-neutral-500 mt-4">Loading posts...</Text>
          </View>
        ) : error ? (
          <View className="items-center justify-center py-20">
            <Text className="text-danger-600 text-base">{error}</Text>
            <TouchableOpacity
              onPress={() => loadPosts()}
              className="mt-4 bg-primary-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredPosts.length === 0 ? (
          <View className="items-center justify-center py-20">
            <SearchX color="#9ca3af" size={64} strokeWidth={1.5} />
            <Text className="text-neutral-500 text-base mt-4">
              {searchQuery ? "No posts found" : "No posts yet"}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                onPress={() => router.push("/create-post" as never)}
                className="mt-4 bg-primary-600 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">
                  Create the first post
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredPosts.map((post, index) => (
            <Animated.View
              key={post.id}
              entering={FadeInDown.delay(index * 50).duration(400)}
            >
              <ForumPostCard
                post={post}
                onPress={() =>
                  router.push(`/post-detail?id=${post.id}` as never)
                }
                onVote={(voteType) => handleVote(post.id, voteType)}
                isVoting={votingPostId === post.id}
              />
            </Animated.View>
          ))
        )}

        {/* Bottom padding */}
        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
