// frontend/src/pages/HowToPlay.tsx
// Complete guide explaining all features of Singuage

import { useState } from 'react';
import { 
  BookOpen, Music2, TrendingUp, Target, Trophy, Settings as SettingsIcon,
  UserCircle, Calendar, Flame, CheckCircle, Languages, Volume2
} from 'lucide-react';
import { motion } from 'framer-motion';

type GuideSection = 
  | 'account-info'
  | 'achievements'
  | 'add-songs'
  | 'change-difficulty'
  | 'difficulties'
  | 'discover'
  | 'learned-words'
  | 'learning-session'
  | 'my-library'
  | 'progress-tracking'
  | 'settings'
  | 'vocabulary'
  | 'words-to-work-on';

interface GuideTopic {
  id: GuideSection;
  title: string;
  icon: any;
}

const GUIDE_TOPICS: GuideTopic[] = [
  { id: 'account-info', title: 'Account Info', icon: UserCircle },
  { id: 'achievements', title: 'Achievements', icon: Trophy },
  { id: 'add-songs', title: 'Add Songs', icon: Music2 },
  { id: 'change-difficulty', title: 'Change Difficulty', icon: Target },
  { id: 'difficulties', title: 'Difficulties', icon: Target },
  { id: 'discover', title: 'Discover', icon: TrendingUp },
  { id: 'learned-words', title: 'Learned Words', icon: CheckCircle },
  { id: 'learning-session', title: 'Learning Session', icon: BookOpen },
  { id: 'my-library', title: 'My Library', icon: Music2 },
  { id: 'progress-tracking', title: 'Progress Tracking', icon: Calendar },
  { id: 'settings', title: 'Settings', icon: SettingsIcon },
  { id: 'vocabulary', title: 'Vocabulary', icon: Languages },
  { id: 'words-to-work-on', title: 'Words to Work on', icon: Volume2 },
];

const GUIDE_CONTENT: Record<GuideSection, { title: string; content: string[] }> = {
  'account-info': {
    title: 'Account Info',
    content: [
      '📋 **What it is:** Your personal profile page where you can view and edit your account details.',
      '',
      '🔧 **How to access:** Click your profile picture in the top right corner, then select "Account Info".',
      '',
      '✏️ **What you can do:**',
      '• **Edit Display Name:** Click the edit icon next to your name to change how you appear on Singuage',
      '• **View Email:** Your registered email address (cannot be changed)',
      '• **See Native Language:** The language you speak natively',
      '• **Account Type:** Shows whether you\'re an Adult (18+) or Minor account',
      '• **Member Since:** When you created your account',
      '• **Edit Target Languages:** Click "Edit" to select which languages you want to learn',
      '• **View Stats:** See your Total XP and Current Streak at a glance',
      '',
      '💡 **Pro Tip:** Keep your target languages updated so Discover shows relevant songs!'
    ]
  },
  'achievements': {
    title: 'Achievements',
    content: [
      '🏆 **What it is:** A collection of badges you can unlock by completing various challenges.',
      '',
      '🔧 **How to access:** Click your profile picture → "Achievements".',
      '',
      '📊 **Achievement Categories:**',
      '• **Learning:** Complete songs and practice regularly',
      '• **Streak:** Maintain consecutive days of practice',
      '• **XP:** Earn experience points through learning',
      '• **Languages:** Learn songs in multiple languages',
      '• **Mastery:** Achieve perfect accuracy scores',
      '• **Challenge:** Complete difficult tasks',
      '',
      '🎯 **How it works:**',
      '• Locked achievements show your progress with a progress bar',
      '• Unlocked achievements display in gold with the date you earned them',
      '• Click category filters to view specific achievement types',
      '',
      '💡 **Pro Tip:** Check achievements regularly to see what goals you\'re close to completing!'
    ]
  },
  'add-songs': {
    title: 'Add Songs',
    content: [
      '➕ **What it is:** Add new songs to your library by pasting their lyrics.',
      '',
      '🔧 **How to add a song:**',
      '1. Go to the **Discover** tab',
      '2. Search for or browse songs',
      '3. Click **"+ Add Song"** on any video',
      '4. You\'ll be taken to the Add Song page with the video loaded',
      '5. Fill in: Title, Artist, Language (optional - auto-detected), and **Lyrics** (required)',
      '6. Click **"Add & Start Learning"**',
      '',
      '🎵 **Important:**',
      '• **Lyrics are REQUIRED** - you cannot add a song without them',
      '• Language is automatically detected from the lyrics',
      '• Check "Manually set language" if auto-detection is wrong',
      '• Paste lyrics with one line per lyric phrase for best timing',
      '',
      '✏️ **Editing songs:**',
      '• In My Library, click the three-dot menu (⋮) on any song',
      '• Select "Change Lyrics" to update the song',
      '',
      '💡 **Pro Tip:** Copy lyrics from reliable sources like Genius or AZLyrics for accuracy!'
    ]
  },
  'change-difficulty': {
    title: 'Change Difficulty',
    content: [
      '🎚️ **What it is:** Switch between Easy, Medium, and Hard modes during a learning session.',
      '',
      '🔧 **How to change:**',
      '1. During a learning session, scroll down on the right side',
      '2. Click the **"Change Difficulty"** button',
      '3. If you have progress, confirm that you want to restart',
      '4. Select your new difficulty level',
      '',
      '⚠️ **Important:**',
      '• Changing difficulty **restarts your progress** from line 1',
      '• Your current session data will not be saved',
      '• The video player restarts from the beginning',
      '• This ensures fair XP rewards for the chosen difficulty',
      '',
      '💡 **Pro Tip:** Choose your difficulty at the start to avoid losing progress!'
    ]
  },
  'difficulties': {
    title: 'Difficulties',
    content: [
      '🎯 **Three difficulty levels to match your skill:**',
      '',
      '🟢 **EASY MODE** (+10 XP per line)',
      '• All lyrics are fully visible',
      '• Click any word to see its translation',
      '• Perfect for beginners or learning new songs',
      '• See the full sentence context with word highlighted',
      '',
      '🟡 **MEDIUM MODE** (+20 XP per line)',
      '• Vowels are hidden (replaced with _ )',
      '• Example: "Hello World" → "H_ll_ W_rld"',
      '• Click words to see translation (vowels still hidden in original)',
      '• Great for intermediate learners who know basic vocabulary',
      '',
      '🔴 **HARD MODE** (+30 XP per line)',
      '• All letters are hidden (replaced with • )',
      '• Click words to see translation of the **PREVIOUS line**',
      '• On the first line, clicking shows blank (no previous line)',
      '• Labels change to "PREVIOUS LINE: ORIGINAL" and "PREVIOUS LINE: TRANSLATION"',
      '• Ultimate challenge for advanced learners!',
      '',
      '💡 **Pro Tip:** Medium and Hard modes help you actually memorize the lyrics rather than just copying them!'
    ]
  },
  'discover': {
    title: 'Discover',
    content: [
      '🔍 **What it is:** Browse and search for new songs to add to your library.',
      '',
      '🔧 **How to use:**',
      '1. Click the **"Discover"** tab on the dashboard',
      '2. Songs are automatically shown based on your target languages',
      '3. Use the search bar to find specific songs or artists',
      '4. Click **"Refresh"** to load new song suggestions',
      '',
      '🎵 **Song cards show:**',
      '• Video thumbnail',
      '• Song title and artist',
      '• Language badge (e.g., "EN", "ES", "FR")',
      '• "✓ Added" badge if you\'ve already added the song',
      '• View count for popular songs',
      '',
      '➕ **Adding songs:**',
      '• Click **"+ Add Song"** to go to the Add Song page',
      '• If already added, click **"View Song"** to see it in your library',
      '• You\'ll need to paste lyrics before the song can be added',
      '',
      '💡 **Pro Tip:** Discover uses your target languages - update them in Account Info for better recommendations!'
    ]
  },
  'learned-words': {
    title: 'Learned Words',
    content: [
      '✅ **What it is:** Words you\'ve successfully tested and mastered.',
      '',
      '🔧 **How to access:** Progress → Vocabulary tab → Scroll to "Learned Words" section.',
      '',
      '📚 **How words become "learned":**',
      '1. Add words to "Words to Work on" during learning sessions',
      '2. In the Vocabulary section, click **"Mark as Learned"** on any word',
      '3. Type the correct translation when prompted',
      '4. If correct, the word moves to Learned Words!',
      '',
      '✨ **Features:**',
      '• Words display in a grid with a green checkmark',
      '• Shows the word and its translation',
      '• Organized by language',
      '• Stays in your learned collection permanently',
      '',
      '💡 **Pro Tip:** Review your learned words occasionally to keep them fresh in memory!'
    ]
  },
  'learning-session': {
    title: 'Learning Session',
    content: [
      '🎓 **What it is:** The main learning interface where you practice typing song lyrics.',
      '',
      '🎮 **How it works:**',
      '1. Select a song from My Library and click **"Start Learning"**',
      '2. Choose your difficulty (Easy, Medium, or Hard)',
      '3. Watch the video and type the lyrics as they appear',
      '4. Complete all lines to finish the session and earn XP',
      '',
      '🎹 **Interface elements:**',
      '• **Video Player:** Shows the music video (top left)',
      '• **Current Line:** Displays the lyric line you need to type',
      '• **Input Field:** Where you type the lyrics',
      '• **Progress:** Shows lines completed and accuracy percentage',
      '• **Grammar Dropdown:** Educational grammar concepts found in the song',
      '',
      '🔤 **Typing mechanics:**',
      '• Letters turn **green** when typed correctly',
      '• Letters turn **red** if typed incorrectly',
      '• Spaces and punctuation are automatically handled',
      '• Line advances when you\'ve typed enough correct characters',
      '',
      '⌨️ **Keyboard shortcuts:**',
      '• **↑** - Play/Pause video',
      '• **↓** - Rewind to current line',
      '• **←** - Seek backward 5 seconds',
      '• **→** - Seek forward 5 seconds',
      '• **?** - Show keyboard shortcuts',
      '',
      '🔄 **Take a Break:**',
      '• Click the **"Take a Break"** button (top-left corner)',
      '• Your progress is automatically saved',
      '• Resume anytime within 7 days',
      '',
      '💡 **Pro Tip:** Click on any word to see its translation without leaving the session!'
    ]
  },
  'my-library': {
    title: 'My Library',
    content: [
      '📚 **What it is:** Your personal collection of saved songs.',
      '',
      '🔧 **How to access:** Dashboard → "My Library" tab (default view).',
      '',
      '📊 **What you see:**',
      '• **Stats cards:** Total XP, Day Streak, and Song count',
      '• **Song grid:** All your added songs with thumbnails',
      '• **Language badges:** Quick view of each song\'s language',
      '',
      '🎵 **Song card actions:**',
      '• **Start Learning:** Begin a learning session with this song',
      '• **Three-dot menu (⋮):**',
      '  - "Change Lyrics" - Edit the song\'s lyrics or details',
      '  - "Remove" - Delete the song from your library (with confirmation)',
      '',
      '📈 **Understanding stats:**',
      '• **Total XP:** Sum of all experience points earned',
      '• **Day Streak:** Consecutive days you\'ve practiced',
      '• **Songs:** Total number of songs in your library',
      '',
      '🎯 **Empty library:**',
      '• If you have no songs, you\'ll see a prompt to visit Discover',
      '• Click "Browse Songs" to find your first song',
      '',
      '💡 **Pro Tip:** Keep your library organized by removing songs you\'ve mastered or no longer want to practice!'
    ]
  },
  'progress-tracking': {
    title: 'Progress Tracking',
    content: [
      '📊 **What it is:** Track your learning statistics, streaks, and vocabulary progress.',
      '',
      '🔧 **How to access:** Click your profile picture → "Progress".',
      '',
      '📑 **Two main tabs:**',
      '',
      '**1. OVERVIEW TAB:**',
      '• **Total Stats:** XP earned, current level, days since joining',
      '• **Streak Calendar:** Visual calendar showing practice days',
      '• **Current Streak:** How many consecutive days you\'ve practiced',
      '• **Longest Streak:** Your best streak achievement',
      '',
      '**2. VOCABULARY TAB:**',
      '• Switch between languages with the dropdown',
      '• See "Words to Work on" (learning status)',
      '• See "Learned Words" (mastered vocabulary)',
      '• Edit translations or test yourself on words',
      '',
      '🔥 **Streaks:**',
      '• Practice at least once per day to maintain your streak',
      '• Streaks reset to 0 if you miss a day',
      '• The calendar highlights days you\'ve practiced',
      '',
      '⭐ **XP & Levels:**',
      '• Earn XP by completing learning sessions',
      '• Easy mode: +10 XP per line',
      '• Medium mode: +20 XP per line',
      '• Hard mode: +30 XP per line',
      '• Accuracy bonuses can increase XP earned',
      '',
      '💡 **Pro Tip:** Check your progress daily to stay motivated and maintain your streak!'
    ]
  },
  'settings': {
    title: 'Settings',
    content: [
      '⚙️ **What it is:** Customize your Singuage experience and manage your account.',
      '',
      '🔧 **How to access:** Click your profile picture → "Settings".',
      '',
      '🎨 **Appearance:**',
      '• **Theme:** Toggle between Light and Dark mode',
      '• Changes apply immediately across the entire site',
      '',
      '🔔 **Notifications:**',
      '• **Email Notifications:** Updates sent to your email',
      '• **Push Notifications:** Browser notifications (when enabled)',
      '• **Streak Reminders:** Daily reminder to maintain your streak',
      '',
      '🔊 **Audio:**',
      '• **Sound Effects:** Adjust volume for UI sounds',
      '• Slider controls from 0% to 100%',
      '',
      '👤 **Account Actions:**',
      '• **Log Out:** Sign out of your account',
      '• **Delete Account:** Permanently remove your account and all data (requires confirmation)',
      '',
      '📱 **App Info:**',
      '• Version number',
      '• Build information',
      '• Account creation date',
      '',
      '💡 **Pro Tip:** Enable streak reminders if you want help maintaining your daily practice!'
    ]
  },
  'vocabulary': {
    title: 'Vocabulary',
    content: [
      '📖 **What it is:** Your personal vocabulary list with words you\'re learning and have mastered.',
      '',
      '🔧 **How to access:** Progress → "Vocabulary" tab.',
      '',
      '➕ **Adding words:**',
      '1. During a learning session, click any word',
      '2. A translation modal appears',
      '3. Click **"+ Words to Work on"** at the bottom',
      '4. The word is added to your vocabulary list',
      '',
      '📚 **Two sections:**',
      '',
      '**1. Words to Work on (Learning):**',
      '• Words you\'re currently learning',
      '• Shows word, translation, and context sentence',
      '• Actions available:',
      '  - Edit translation (pencil icon)',
      '  - Mark as Learned (test yourself)',
      '  - Delete word (trash icon)',
      '',
      '**2. Learned Words (Mastered):**',
      '• Words you\'ve successfully tested',
      '• Displayed in a grid with checkmarks',
      '• Shows word and translation',
      '• Permanently saved in your learned collection',
      '',
      '✅ **Testing yourself:**',
      '1. Click "Mark as Learned" on any word',
      '2. Type the translation in lowercase',
      '3. Accent marks are automatically ignored',
      '4. If correct, word moves to Learned!',
      '5. If incorrect, try again',
      '',
      '🌍 **Multi-language support:**',
      '• Switch languages using the dropdown',
      '• Each language has separate word lists',
      '• Statistics show words per language',
      '',
      '💡 **Pro Tip:** Add words you find challenging during songs - it\'s the best way to build vocabulary!'
    ]
  },
  'words-to-work-on': {
    title: 'Words to Work on',
    content: [
      '📝 **What it is:** Your active vocabulary list - words you\'re currently learning.',
      '',
      '🔧 **How to access:** Progress → Vocabulary tab → Top section.',
      '',
      '➕ **How words get added:**',
      '• Click any word during a learning session',
      '• Click **"+ Words to Work on"** in the translation modal',
      '• Word is saved with its translation and context',
      '',
      '📋 **Word card features:**',
      '• **Word:** The vocabulary word in the target language',
      '• **Translation:** English (or native language) translation',
      '• **Context:** The sentence where you found the word',
      '• **Language badge:** Shows the word\'s language (e.g., "ES", "FR")',
      '',
      '✏️ **Actions you can take:**',
      '• **Edit (pencil icon):** Change the translation if needed',
      '• **Mark as Learned:** Test yourself on the word',
      '• **Delete (trash icon):** Remove from your list',
      '',
      '✅ **Testing process:**',
      '1. Click "Mark as Learned" button',
      '2. A modal appears showing the word',
      '3. Type the translation in lowercase',
      '4. Accent marks are automatically ignored',
      '5. ✅ Correct → Word moves to Learned Words',
      '6. ❌ Incorrect → Keep practicing!',
      '',
      '💡 **Pro Tip:** Review this section before each session to refresh words you\'re learning!'
    ]
  }
};

export const HowToPlay = () => {
  const [selectedSection, setSelectedSection] = useState<GuideSection>('add-songs');

  const selectedContent = GUIDE_CONTENT[selectedSection];

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
              {selectedContent.content.map((paragraph, index) => {
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
