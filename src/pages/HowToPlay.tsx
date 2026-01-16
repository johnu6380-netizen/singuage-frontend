// frontend/src/pages/HowToPlay.tsx
// Complete guide explaining all features of Singuage

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen, Music2, TrendingUp, Target, Trophy, Settings as SettingsIcon,
  UserCircle, Calendar, CheckCircle, Languages, Volume2
} from 'lucide-react';
import { motion } from 'framer-motion';

type GuideSection = string;

interface GuideTopic {
  id: string;
  title: string;
  icon: any;
}

// Map of topic id -> icon component
const TOPIC_ICONS: Record<string, any> = {
  'account-info': UserCircle,
  achievements: Trophy,
  'add-songs': Music2,
  'change-difficulty': Target,
  difficulties: Target,
  discover: TrendingUp,
  'learned-words': CheckCircle,
  'learning-session': BookOpen,
  'my-library': Music2,
  'progress-tracking': Calendar,
  settings: SettingsIcon,
  vocabulary: Languages,
  'words-to-work-on': Volume2,
};

export const HowToPlay = () => {
  const { t } = useTranslation();
  const [selectedSection, setSelectedSection] = useState<GuideSection>('add-songs');

  // Load topics and content from translations (returnObjects: true returns nested objects/arrays)
  const topics = (t('pages.how_to_play.topics', { returnObjects: true }) || {}) as Record<string, string>;
  const contentObj = (t('pages.how_to_play.content', { returnObjects: true }) || {}) as Record<string, { title: string; paragraphs: string[] }>;

  const GUIDE_TOPICS: GuideTopic[] = Object.keys(topics).map((key) => ({ id: key, title: topics[key], icon: TOPIC_ICONS[key] || UserCircle }));

  function resolveContent(section: string) {
    if (!section) return null;
    // direct match
    if (contentObj[section]) return contentObj[section];
    // try replacing - with _ and vice versa
    const alt1 = section.replace(/-/g, '_');
    if (contentObj[alt1]) return contentObj[alt1];
    const alt2 = section.replace(/_/g, '-');
    if (contentObj[alt2]) return contentObj[alt2];
    // try lowercased key
    const alt3 = section.toLowerCase();
    if (contentObj[alt3]) return contentObj[alt3];
    return null;
  }

  const resolved = resolveContent(selectedSection);
  const selectedContent = resolved || { title: topics[selectedSection] || selectedSection, paragraphs: [t('pages.how_to_play.no_description')] };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Topic List */}
      <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        <div className="p-4">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Guide Topics
          </h3>
          <div className="space-y-1">
            {GUIDE_TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedSection(topic.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selectedSection === topic.id
                      ? 'bg-primary-100 font-semibold text-primary-900 dark:bg-primary-900/20 dark:text-primary-100'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{topic.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-8">
          <motion.div
            key={selectedSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Title */}
            <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {selectedContent.title}
            </h2>

            {/* Content */}
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              {selectedContent.paragraphs.map((paragraph, index) => {
                // Handle empty lines as spacing
                if (paragraph === '') {
                  return <div key={index} className="h-2" />;
                }

                // Handle bold text with **
                const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                return (
                  <p key={index} className="leading-relaxed">
                    {parts.map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                          <strong key={i} className="font-semibold text-gray-900 dark:text-gray-100">
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </p>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};