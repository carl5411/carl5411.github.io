// spotifyService.js
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SCOPES = ['playlist-modify-public', 'playlist-modify-private'];

// Initialize Spotify authorization
export const initiateSpotifyAuth = async () => {
    console.log('went in here because we dont have a token')
    console.log('mode: ', `${import.meta.env.MODE}`)
    console.log(SPOTIFY_API_URL, SPOTIFY_AUTH_URL)
    localStorage.setItem('auth_in_progress', 'true');
    const authUrl = `${SPOTIFY_AUTH_URL}?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}`;
    console.log('authurl: ', authUrl)
    window.location.href = authUrl;
    return false;
};

// Get access token from URL after auth
export const getAccessTokenFromUrl = () => {
    console.log('parser got:', window.location.hash)
    const hash = window.location.hash
        .substring(1)
        .split('&')
        .reduce((initial, item) => {
            const parts = item.split('=');
            initial[parts[0]] = decodeURIComponent(parts[1]);
            return initial;
        }, {});
    console.log('parsed ', hash)
    return hash.access_token;
};

// Create a new playlist
export const createPlaylist = async (accessToken, userId, playlistName, description = '') => {
    try {
        console.log('trying to create playlist')
        const response = await fetch(`${SPOTIFY_API_URL}/users/${userId}/playlists`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: playlistName,
                description,
                public: true,
            }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating playlist:', error);
        throw error;
    }
};

// Search for tracks
export const searchTracks = async (accessToken, songs) => {
    const trackUris = [];
    console.log('searching for tracks')
    for (const song of songs) {
        try {
            const searchParams = new URLSearchParams({
                q: song,
                type: 'track',
                limit: 1
            }).toString();

            const response = await fetch(`${SPOTIFY_API_URL}/search?${searchParams}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            const data = await response.json();
            if (data.tracks.items.length > 0) {
                console.log('found: ', data.tracks.items[0].uri)
                trackUris.push(data.tracks.items[0].uri);
            }
        } catch (error) {
            console.error(`Error searching for track "${song}":`, error);
        }
    }

    return trackUris;
};

// Add tracks to playlist
export const addTracksToPlaylist = async (accessToken, playlistId, trackUris) => {
    try {
        console.log('adding tracks 2 playlist')
        const response = await fetch(`${SPOTIFY_API_URL}/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                uris: trackUris,
            }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error adding tracks to playlist:', error);
        throw error;
    }
};


// Example usage in your app component:
export const exportToSpotify = async (songRecommendations, accessToken) => {
    // Get the access token (either from storage or auth flow)
    
    console.log('Spotify Service Receives These SongRecommendations: ', songRecommendations)
    localStorage.setItem('pending_playlist_songs', JSON.stringify(songRecommendations))

    // const accessToken = localStorage.getItem('spotify_token');

    if (!accessToken) {
        console.log('no saved auth token, requesting one')
        initiateSpotifyAuth();
        return
    }
    else{
        console.log('parsed token: ', accessToken)
    }
    //now we should have a token and some songs to make the playlist with

    try {
        // Get user profile to get user ID
        console.log('trying to get user profile')
        const userResponse = await fetch(`${SPOTIFY_API_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        const userData = await userResponse.json();
        console.log(userData)
        // Create new playlist
        const playlist = await createPlaylist(
            accessToken,
            userData.id,
            'AI Generated Recommendations',
            'Playlist generated from AI recommendations'
        );
        console.log('supposedly created playlist: ', playlist)
        // Search for tracks and get their URIs
        const trackUris = await searchTracks(accessToken, songRecommendations);

        // Add tracks to playlist
        if (trackUris.length > 0) {
            await addTracksToPlaylist(accessToken, playlist.id, trackUris);
            return playlist.external_urls.spotify; // Return playlist URL
        }
        console.log('Supposedly done.')
    } catch (error) {
        console.error('Error exporting to Spotify:', error);
        throw error;
    }
};