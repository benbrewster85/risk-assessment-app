// /components/LatestNews.tsx
import { BookOpen } from "lucide-react";

// Define the shape of a news item
type NewsItem = {
  id: string;
  created_at: string;
  title: string;
  content: string;
  author: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

type LatestNewsProps = {
  newsItems: NewsItem[];
};

export default function LatestNews({ newsItems }: LatestNewsProps) {
  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <BookOpen size={22} className="mr-3 text-gray-600" />
        Latest News
      </h2>
      {newsItems && newsItems.length > 0 ? (
        <ul className="space-y-5">
          {newsItems.map((item) => (
            <li
              key={item.id}
              className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
            >
              <h3 className="font-semibold text-gray-800">{item.title}</h3>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                {item.content}
              </p>
              <div className="text-xs text-gray-400 mt-2">
                <span>
                  Posted by{" "}
                  <strong>
                    {item.author
                      ? `${item.author.first_name} ${item.author.last_name}`
                      : "Unknown User"}
                  </strong>
                </span>
                <span className="mx-1">|</span>
                <span>
                  {new Date(item.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 mt-4">No news or announcements yet.</p>
      )}
    </div>
  );
}
