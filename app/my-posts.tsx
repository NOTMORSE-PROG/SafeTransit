// My Posts Screen
// User's posts management page

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Flag,
  Search,
  TrendingUp,
  Clock,
  Filter,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { FlairBadge } from "@/components/forum/FlairBadge";
import {
  getPosts,
  deletePost,
  type ForumPostWithAuthor,
  type PostFlair,
} from "@/services/forumService";
import { FLAIR_CONFIG } from "@/services/types/forum";

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
  return "Just now";
}

function getStatusIcon(status: string) {
  switch (status) {
    case "visible":
      return { Icon: Eye, color: "#16a34a", label: "Visible" };
    case "hidden":
      return { Icon: EyeOff, color: "#dc2626", label: "Hidden (Low Votes)" };
    case "flagged":
      return { Icon: Flag, color: "#f59e0b", label: "Flagged for Review" };
    default:
      return { Icon: Eye, color: "#6b7280", label: status };
  }
}

export default function MyPosts() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

  const [posts, setPosts] = useState<ForumPostWithAuthor[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedFlair, setSelectedFlair] = useState<PostFlair | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "visible" | "hidden" | "flagged"
  >("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [searchQuery, setSearchQuery] = useState("");

  const loadPosts = useCallback(
    async (showRefresh = false, reset = false) => {
      if (!token || !user) return;

      try {
        if (reset) {
          setPage(1);
          setHasMore(true);
        }
        if (showRefresh) setIsRefreshing(true);
        else if (reset) setIsLoading(true);
        setError(null);

        const response = await getPosts({
          authorId: user.id,
          token,
          limit: 20,
          page: reset ? 1 : page,
          sort: sortBy,
          flair: selectedFlair === "all" ? undefined : selectedFlair,
        });

        if (reset || showRefresh) {
          setPosts(response.data);
        } else {
          setPosts((prev) => [...prev, ...response.data]);
        }

        const { pagination } = response;
        setHasMore(pagination.page < pagination.totalPages);
        if (!reset && !showRefresh) setPage((p) => p + 1);
      } catch (err) {
        console.error("Failed to load posts:", err);
        setError(err instanceof Error ? err.message : "Failed to load posts");
      } finally {
        if (reset) setIsLoading(false);
        setIsRefreshing(false);
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [token, user, page, sortBy, selectedFlair],
  );

  useEffect(() => {
    loadPosts(false, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, selectedFlair]);

  // Derived, client-side filtering for status and search
  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((p) => {
      const statusOk =
        statusFilter === "all" ? true : p.status === statusFilter;
      const searchOk = q
        ? p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)
        : true;
      return statusOk && searchOk;
    });
  }, [posts, statusFilter, searchQuery]);

  const loadMore = async () => {
    if (!hasMore || isLoadingMore || isLoading || isRefreshing) return;
    setIsLoadingMore(true);
    await loadPosts(false, false);
  };

  const handleDelete = (postId: string, postTitle: string) => {
    Alert.alert(
      "Delete Post",
      `Are you sure you want to delete "${postTitle}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            setDeletingPostId(postId);
            try {
              await deletePost(postId, token);
              setPosts((prev) => prev.filter((p) => p.id !== postId));
              Alert.alert("Success", "Post deleted successfully");
            } catch {
              Alert.alert("Error", "Failed to delete post");
            } finally {
              setDeletingPostId(null);
            }
          },
        },
      ],
    );
  };

  if (!user || !token) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-xl font-bold text-neutral-900 mb-2">
          Sign In Required
        </Text>
        <Text className="text-neutral-600 text-center mb-6">
          You need to be signed in to manage your posts.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
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
          onPress={() => router.push("/create-post" as never)}
          className="p-2"
        >
          <Plus color="#2563eb" size={24} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Controls: Search + Sort */}
      <View className="bg-white px-4 py-3 border-b border-neutral-100">
        <View className="flex-row items-center bg-neutral-100 rounded-xl px-3 py-2">
          <Search color="#6b7280" size={18} strokeWidth={2} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search my posts"
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 text-neutral-900"
            autoCorrect={false}
          />
        </View>
        <View className="flex-row items-center mt-3">
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
      </View>

      {/* Flair Filter (fixed height + centered chips) */}
      <View className="bg-white border-b border-neutral-100 px-4 py-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {(
            [
              "all",
              "general",
              "routes",
              "questions",
              "experiences",
              "tips_advice",
            ] as (PostFlair | "all")[]
          ).map((flair) => (
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

      {/* Status Filter */}
      <View className="bg-white px-4 py-3 border-b border-neutral-100">
        <View className="flex-row">
          {(["all", "visible", "hidden", "flagged"] as const).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStatusFilter(s)}
              className={`mr-2 px-3 py-1.5 rounded-lg ${
                statusFilter === s ? "bg-neutral-900" : "bg-neutral-100"
              }`}
            >
              <Text
                className={
                  statusFilter === s
                    ? "text-white text-sm"
                    : "text-neutral-700 text-sm"
                }
              >
                {s[0].toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
            <Text className="text-neutral-500 text-base mb-4">
              You haven't created any posts yet
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/create-post" as never)}
              className="bg-primary-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">
                Create Your First Post
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredPosts.map((post, index) => {
            const status = getStatusIcon(post.status);
            const isDeleting = deletingPostId === post.id;

            return (
              <Animated.View
                key={post.id}
                entering={FadeInDown.delay(index * 50).duration(400)}
              >
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/post-detail?id=${post.id}` as never)
                  }
                  className="bg-white rounded-2xl p-4 mb-3 shadow-soft"
                  activeOpacity={0.7}
                  disabled={isDeleting}
                >
                  {/* Header: Flair + Status */}
                  <View className="flex-row items-center justify-between mb-2">
                    <FlairBadge flair={post.flair} size="sm" />
                    <View className="flex-row items-center">
                      <status.Icon
                        color={status.color}
                        size={14}
                        strokeWidth={2}
                      />
                      <Text
                        className="text-xs font-medium ml-1"
                        style={{ color: status.color }}
                      >
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text
                    className="text-base font-bold text-neutral-900 mb-1"
                    numberOfLines={2}
                  >
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
                      onPress={() =>
                        router.push(`/create-post?id=${post.id}` as never)
                      }
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
        {/* Load more */}
        {!isLoading && !isRefreshing && filteredPosts.length > 0 && hasMore && (
          <View className="items-center py-4">
            <TouchableOpacity
              onPress={loadMore}
              disabled={isLoadingMore}
              className="bg-neutral-900 px-5 py-2 rounded-xl"
            >
              {isLoadingMore ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold">Load More</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
