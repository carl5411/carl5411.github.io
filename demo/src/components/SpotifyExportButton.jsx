import React, { useEffect, useState } from 'react';
import { exportToSpotify } from '../../spotifyService';

const SpotifyExportButton = ({ songRecommendations, token }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState(null);
    const [error, setError] = useState(null);

    const handleExport = async () => {
        setIsExporting(true);
        setError(null);
        try {
            const url = await exportToSpotify(songRecommendations, token);
            setPlaylistUrl(url);
        } catch (error) {
            setError('Failed to export playlist. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        if (token) {
            handleExport()
        }
    }, [token])

    return (
        <div className="flex flex-col items-center gap-4">
            <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isExporting ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Exporting...
                    </>
                ) : (
                    'Export to Spotify'
                )}
            </button>

            {error && (
                <p className="text-red-500">{error}</p>
            )}

            {playlistUrl && (
                <a
                    href={playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-600 underline"
                >
                    Open Playlist in Spotify
                </a>
            )}
        </div>
    );
};

export default SpotifyExportButton;