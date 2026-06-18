import { useQuery } from "@tanstack/react-query";
import api from "../utils/api";

export const useBlogs = () =>
  useQuery({
    queryKey: ["blogs"],
    queryFn: async () => (await api.get("/user/blogs")).data.posts,
  });

export const useBlogPost = (slug) =>
  useQuery({
    queryKey: ["blog", slug],
    queryFn: async () => (await api.get(`/user/blogs/${slug}`)).data.post,
    enabled: Boolean(slug),
  });
