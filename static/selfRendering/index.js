// create Agora client
var client = AgoraRTC.createClient({
  mode: "live",
  codec: "vp8"
});
AgoraRTC.enableLogUpload();
var localTracks = {
  videoTrack: null,
  audioTrack: null
};
var Muted= true ;
var remoteUsers = {};
// Agora client options
var urlParams = new URLSearchParams(window.location.search);
var channelName = urlParams.get('name');

var response = $.ajax({
            url: '/token',
            type: 'POST',
            data: { channelName: channelName },
            async: false
        }).responseText;
response=JSON.parse(response);
var options = {
  appid: "d19e2aacb0dd4f03be71a95d505f3cff",
  channel: response["channelname"],
  uid: 0,
  token:response["token"],
  role: "audience",
  // host or audience
  audienceLatency: 2

};

$("#leave").click(function (e) {
  leave();
});

async function join() {
  // create Agora client

  if (options.role === "audience") {
    client.setClientRole(options.role, {
      level: options.audienceLatency
    });
    // add event listener to play remote tracks when remote user publishs.
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
  } else {
    client.setClientRole(options.role);
  }

  // join the channel
  options.uid = await client.join("d19e2aacb0dd4f03be71a95d505f3cff", options.channel, options.token || null, options.uid || null);
  console.log("Joined channel: " + options.channel);
  if (options.role === "host") {
    // create local audio and video tracks
    if (!localTracks.audioTrack) {
      localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    }
    if (!localTracks.videoTrack) {
      localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
    }
    // play local video track
    //localTracks.videoTrack.play("local-player");
    $("#local-player-name").text(`localTrack(${options.uid})`);

    //create the mirror of local player
    $("#local-player-mirror-area").show();
    $("#joined-setup").css("display", "flex");
    

    // publish local tracks to channel
    await client.publish(Object.values(localTracks));
    console.log("publish success");
  }
}
async function leave() {
  for (trackName in localTracks) {
    var track = localTracks[trackName];
    if (track) {
      track.stop();
      track.close();
      localTracks[trackName] = undefined;
    }
  }

  // remove remote users and player views
  remoteUsers = {};
  $("#remote-playerlist").html("");

  // leave the channel
  await client.leave();
  $("#local-player-name").text("");
  $("#host-join").attr("disabled", false);
  $("#audience-join").attr("disabled", false);
  $("#leave").attr("disabled", true);
  $(".video-mirror").hide();
  $("#joined-setup").css("display", "none");
  console.log("client leaves channel success");
}
async function subscribe(user, mediaType) {
  const uid = user.uid;
  // subscribe to a remote user
  await client.subscribe(user, mediaType);
  console.log("subscribe success");
  if (mediaType === 'video') {
    var mirrorRemotePlayer = document.getElementById(`video_track-video-mirror`);
    mirrorRemotePlayer.controls = true;
    
    //get browser-native object MediaStreamTrack from WebRTC SDK
    const msTrack = user.videoTrack.getMediaStreamTrack();
    //generate browser-native object MediaStream with above video track
    const ms = new MediaStream([msTrack]);
    mirrorRemotePlayer.srcObject = ms;
    mirrorRemotePlayer.play();
    //user.audioTrack.mute()
    $("#mute-audio").click(function (e) {
      if (Muted===true) {
        user.audioTrack.play();
        Muted=false;
        //$("#mute-audio").text("Mute Audio");
      } else {
        user.audioTrack.stop();
        Muted=true;
      }
    });

    
  }
  if (mediaType === 'audio') {
    
    user.audioTrack.stop();
  }

}



function handleUserPublished(user, mediaType) {
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}
function handleUserUnpublished(user, mediaType) {
  if (mediaType === 'video') {
    const id = user.uid;
    delete remoteUsers[id];
    $(`#player-wrapper`).remove();
  }
}

join();