import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getAccessTokenFromUrl } from '../spotifyService';
import SpotifyExportButton from './components/SpotifyExportButton';

const MusicRequestApp = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [makingPlaylist, setMakingPlaylist] = useState(false);
  const [token, setToken] = useState(null);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('https://us-central1-gorillachowserverless.cloudfunctions.net/process_prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input })
      });

      if (!response.ok) throw new Error('Failed to fetch recommendations');

      const data = await response.json();
      setResults(data);
      localStorage.setItem('last-results', JSON.stringify(data))
    } catch (err) {
      setError('Unable to generate recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleSpotifyAuth = async () => {
      const token = await getAccessTokenFromUrl()
      if (token) {
        console.log('app found token from url')
        //we came from a spotify redirect
        const savedResults = JSON.parse(localStorage.getItem('last-results'))
        if (savedResults) {
          console.log('found saved results:', savedResults)
          // Clean up
          // localStorage.removeItem('pending_playlist_songs');
          // Now you can proceed with playlist creation using savedSongs
          setResults(savedResults)
          setToken(token)
          setMakingPlaylist(true)
        }
        // localStorage.setItem('spotify_token', token)
        // window.history.pushState({}, null, '/')
      }
      else{
        console.log('App did not find token from url')
      }
    }
    handleSpotifyAuth()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Music Discovery
          </h1>

          <div className="space-y-6">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe the music you're looking for..."
                className="w-full h-32 p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
              />

              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className={`mt-4 w-full py-3 px-6 text-lg font-medium rounded-xl transition-all
                  ${!input.trim() || isLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-95'
                  }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Generating...
                  </span>
                ) : 'Get Recommendations'}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {results && (
              <div className="space-y-8 mt-8">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Mood</h2>
                  <div className="flex flex-wrap gap-2">
                    {results.adjectives.map((adj, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {adj}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Recommended Songs</h2>
                  <SpotifyExportButton songRecommendations={results.matches.map(item => item[0])} token={token}/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.matches.map(([song, [adjectives, score]], index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <h3 className="font-medium text-lg text-gray-900 mb-2">{song}</h3>
                        <p className="text-gray-600 text-sm mb-2">{adjectives}</p>
                        <p className="text-sm font-medium text-blue-600">
                          Match Score: {score}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicRequestApp;