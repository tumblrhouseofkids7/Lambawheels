import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import IncomingArticlesForm from '../components/IncomingArticlesForm';
import IncomingArticlesList from '../components/IncomingArticlesList';

const IncomingArticles = () => {
  return (
    <div className="space-y-4 md:space-y-6 pb-6 animate-fade-in w-full max-w-4xl mx-auto px-4 md:px-0">
      <div className="flex items-center gap-3 mb-2 md:mb-0">
        <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold text-gray-800 md:hidden">Incoming Articles</h1>
      </div>
      <IncomingArticlesForm />
      <IncomingArticlesList />
    </div>
  );
};

export default IncomingArticles;
