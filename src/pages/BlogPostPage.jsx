import React from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useBlogPost } from "../hooks/useBlogs";

const BlogPostPage = () => {
  const { slug } = useParams();
  const { data: post, isLoading, isError } = useBlogPost(slug);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="bg-gray-50 min-h-screen">
        <div className="w-full max-w-[600px] mx-auto bg-white min-h-screen shadow-x mb-40 p-6">
          <Link to="/blogs" className="text-orange-600 font-bold text-sm">
            ← Back to Blogs
          </Link>

          {isLoading ? (
            <p className="text-gray-400 mt-6">Loading…</p>
          ) : isError || !post ? (
            <p className="text-gray-400 mt-6">Post not found.</p>
          ) : (
            <article className="mt-4">
              <h1 className="text-2xl font-bold text-gray-800">{post.title}</h1>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
              <p className="text-gray-700 leading-relaxed mt-4 whitespace-pre-line">
                {post.content}
              </p>
            </article>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BlogPostPage;
