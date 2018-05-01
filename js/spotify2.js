var SpotifyModule = function() {	
	
	var CUR_URI = document.location.href.split('#');
	REDIRECT_URI = CUR_URI[0];

	var accessToken;
	var currentPlaying=false;
	
	var spotifyApi = new SpotifyWebApi();
	
	
	function _getSpotify(columndiv){
		var random = getRandomInt(1,100000);
		if(typeof(Cookies.get('spotifyToken'))!=='undefined' || typeof(CUR_URI[1])!=='undefined'){
			if(typeof(CUR_URI[1])!=='undefined'){
				var hash = URLToArray(CUR_URI[1]);
				Cookies.set('spotifyToken',hash.access_token);
				document.location.href=CUR_URI[0];
			}
			accessToken = Cookies.get('spotifyToken');
			spotifyApi.setAccessToken(accessToken);
			
			var html ='<div data-id="spotify" class="col-xs-12 transbg containsspotify containsspotify'+random+'" style="padding:0px !important;">';
			    html+='<div id="current"></div>';
			    html+='<a class="change">'+language.misc.spotify_select_playlist+' &raquo;</a>';
			    html+='<select class="devices" onchange="SpotifyModule.changeDevice();"></select>';
			    html+='</div>';
			$(columndiv).append(html);

			_getData(columndiv,random);
		}
		else if(!settings['spot_clientid']){
			console.log('Enter your Spotify ClientID in CONFIG.JS');
			infoMessage('Spotify:', 'Enter your Spotify ClientID in settings or delete spotify block in your CONFIG.js',10000);
		}
		else {
			var url = _getLoginURL();
			document.location.href=url;
		}

	}

	function _getData(columndiv,rand){
		if($('select.devices option').length === 0) $('select.devices').html('<option>'+language.misc.spotify_select_device+'</option>');

		currentPlaying=false;
		spotifyApi.getMyDevices(function(err, data) {
			if (err) console.error(err);
			else{
				devices = data.devices;
				var sel='';
				for(d in devices){
					sel='';
					if(devices[d]['is_active']){ 
						sel='selected';
					}
					if(!devices[d]['is_restricted']) {
						if($('select.devices option[value="' + devices[d]['id'] + '"]').length === 0) {
							$('select.devices').append('<option value="'+devices[d]['id']+'" '+sel+'>'+devices[d]['name']+'</option>');
						}
					}
				}
			

				spotifyApi.getMyCurrentPlayingTrack(function(err, currently) {
					if(currently.item!==null && typeof(currently.item)!=='undefined'){
						_getCurrentHTML(currently.item, 'currentlyPlaying');
						currentPlaying=currently.item;
					}

					spotifyApi.getUserPlaylists(function(err, playlists) {
						var html = '<div class="modal fade" id="spotify_'+rand+'" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">';
							html+='<div class="modal-dialog">';
							html+='<div class="modal-content">';
							html+='<div class="modal-header">';
							html+='<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>';
							html+='</div>';
							html+='<div class="modal-body" style="padding-left:15px;"><div class="row list">';

						for(p in playlists.items){
							if(typeof(playlists.items[p])!=='undefined' && typeof(playlists.items[p]['uri'])!=='undefined' && typeof(playlists.items[p]['images'][0])!=='undefined'){
								html+='<div class="col-md-3 col-sm-6">';
								html+='<div class="spotlist">';
								html+='<div class="col-lg-4 col-md-5 col-sm-4" style="padding:0px;"><a onclick="SpotifyModule.getPlayList(\''+playlists.items[p]['href']+'\');"><img style="height:75px;width:75px;" src="'+playlists.items[p]['images'][0]['url']+'" /></a></div>';
								html+='<div class="col-lg-8 col-md-7 col-sm-8" style="padding:0px;padding-top:5px;padding-right:10px;">';
								html+='<a onclick="SpotifyModule.getPlayList(\''+playlists.items[p]['owner']['id']+'\',\''+playlists.items[p]['id']+'\');">'+playlists.items[p]['name']+'</a><br />';
								html+='<a onclick="SpotifyModule.getTrackList(\''+playlists.items[p]['owner']['id']+'\',\''+playlists.items[p]['id']+'\',\''+columndiv+'\');"><em>Tracks: '+playlists.items[p]['tracks']['total']+'</em></a></div>';
								html+='</div>';
								html+='</div>';
							}
						}

						html+='</div><div class="row tracks" style="display:none;"></div><br /><br /></div>';
						html+='</div>';
						html+='</div>';
						html+='</div>';

						$('body').append(html);
					});

					var calobject = $('.containsspotify'+rand+' a.change');
					calobject.attr('data-toggle','modal');
					calobject.attr('data-id','');
					calobject.attr('data-target','#spotify_'+rand);
					calobject.attr('onclick','setSrc(this);');
				});
			}
		});
	}


	function _changeDevice(){
		_getCurrentHTML(currentPlaying, 'changedevice');
	}
	function _getCurrentHTML(item, typeAction){
		if(typeof typeAction === 'undefined') typeAction = false;

		if(typeAction !== 'changedevice' && typeof item.uri !== 'undefined') {
			if(item.type === 'track') {
            			data = '{"uris":["'+item.uri+'"]}';
        		}
			else {
            			data = '{"context_uri":"'+item.uri+'"}';
        		}
		}
		else { // when changing device, don't fill in data, just device_id so Spotify will continue there
			data = '';
		}

		if(typeAction !== 'currentlyPlaying') {
        		$.ajax({
            			type: 'PUT',
            			data: data,
            			url: 'https://api.spotify.com/v1/me/player/play?device_id='+$('select.devices').find('option:selected').val(),
            			headers: { 'Authorization': 'Bearer ' + accessToken }
			});
    		}

		var html= '';

		if(typeof(item.album)!=='undefined'){
			html+='<div class="current_image">';
			html+='<img src="'+item.album.images[0].url+'" />';
			html+='</div>';
		}
		else {
			html+='<div class="current_image">';
			html+='<img src="'+item.images[0].url+'" />';
			html+='</div>';
		}

		html+='<div class="current_info">';

		if(typeof(item.artists)!=='undefined'){
			html+='<div class="current_artist">';
			html+=item.artists[0].name;
			html+='</div>';
		}
		else if(typeof(item.name)!=='undefined'){
			html+='<div class="current_artist">';
			html+=item.name;
			html+='</div>';
		}

		if(typeof(item.album)!=='undefined'){
			html+='<div class="current_album">';
			html+=item.album.name;
			html+='</div>';
		}
		else if(typeof(item.description)!=='undefined' && item.description!==null){
			html+='<div class="current_album">';
			html+=item.description;
			html+='</div>';
		}

		html+='</div>';

		$('.containsspotify #current').html(html);
	}

	function _getPlayList(owner,id){
		spotifyApi.getPlaylist(owner,id,function(err, playlist) {
			console.log(playlist);
			_getCurrentHTML(playlist, 'playlist');
		});
	}

	function _getLoginURL(scopes) {
		if(typeof scopes === 'undefined') {
			scopes = [
		            'user-read-email',
		            'user-read-currently-playing',
		            'user-read-playback-state',
		            'user-read-recently-played',
		            'user-modify-playback-state',
		            'playlist-read-private'
		        ];
		}

		return 'https://accounts.spotify.com/authorize?client_id=' + settings['spot_clientid'] +
		  '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
		  '&scope=' + encodeURIComponent(scopes.join(' ')) +
		  '&response_type=token';
	}

	function _showPlaylists(){
		$('div.modal-body .row.list').show();
		$('div.modal-body .row.tracks').html('').hide();
	}

	function _getTrackList(owner,id,back){

		spotifyApi.getPlaylist(owner,id,function(err, tracks) {
			tracks=tracks.tracks;

			var html='<div class="col-md-12"><div class="spotback"><a onclick="SpotifyModule.showPlaylists();">&laquo; '+language.misc.spotify_back_to_playlist+'</a></div></div>';
			for(t in tracks.items){	
				console.log(tracks.items[t]);
				if(typeof(tracks.items[t]['track'])!=='undefined' && typeof(tracks.items[t]['track']['uri'])!=='undefined'){
					html+='<div class="col-md-3 col-sm-6">';
					html+='<div class="spottrack">';
					html+='<div style="margin:10px;"><a onclick="SpotifyModule.getTrack(\''+tracks.items[t]['track']['href']+'\');"><strong>'+tracks.items[t]['track']['artists'][0]['name']+'</strong><br />'+tracks.items[t]['track']['name']+'</a></div>';
					html+='</div>';
					html+='</div>';
				}
			}
			$('div.modal-body .row.list').hide();
			$('div.modal-body .row.tracks').html(html).show();
		});
	}

	//Expose public functions
	return {
		getSpotify: _getSpotify,
		changeDevice: _changeDevice,
		getPlayList: _getPlayList,
		getTrackList: _getTrackList,
		showPlaylists: _showPlaylists
	}

}();

//Wrapper function to stay compatible with current module system
function getSpotify(columndiv)
{
	return SpotifyModule.getSpotify(columndiv);
}
