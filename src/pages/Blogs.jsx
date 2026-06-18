import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useBlogs } from "../hooks/useBlogs";

const Blogs = () => {
  const { data: posts = [], isLoading } = useBlogs();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="bg-gray-50 min-h-screen">
        <div className="w-full max-w-[600px] mx-auto bg-white min-h-screen shadow-x mb-40 p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">From the Bakery</h1>

          {isLoading ? (
            <p className="text-gray-400">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="text-gray-400">No posts yet.</p>
          ) : (
            <div className="space-y-4">
              {posts.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blogs/${p.slug}`}
                  className="block bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h2 className="font-bold text-lg text-gray-800">{p.title}</h2>
                  {p.excerpt && (
                    <p className="text-sm text-gray-500 mt-1">{p.excerpt}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                  <span className="text-orange-600 font-bold text-sm mt-2 inline-block">
                    Read more →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Blogs;
