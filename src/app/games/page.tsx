'use client';

import Link from 'next/link';

export default function GamesPage() {
  const games = [
    {
      id: 'chord',
      title: 'Chord Identifier',
      description: 'Learn and master musical chords',
      icon: 'music_note',
      href: '/games/chord',
    },
    {
      id: 'melody',
      title: 'Melody Recognition',
      description: 'Train your ear with melody recognition',
      icon: 'piano',
      href: '/games/melody',
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-background to-content2 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4 text-foreground">
          Pitch
        </h1>
        <p className="text-center text-foreground/50 mb-12">
          Choose a game to start training your musical skills
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {games.map((game) => (
            <Link key={game.id} href={game.href}>
              <div className="bg-content1 rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer p-8 h-full flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-7xl! bg-linear-to-b from-primary to-secondary bg-clip-text text-transparent mb-6">
                  {game.icon}
                </span>
                <h2 className="text-3xl font-bold text-content1-foreground mb-2">
                  {game.title}
                </h2>
                <p className="text-content1-foreground/50 text-center">{game.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}