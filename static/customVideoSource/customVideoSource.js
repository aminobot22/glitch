/*
 *  These procedures use Agora Video Call SDK for Web to enable local and remote
 *  users to join and leave a Video Call channel managed by Agora Platform.
 */

/*
 *  Create an {@link https://docs.agora.io/en/Video/API%20Reference/web_ng/interfaces/iagorartcclient.html|AgoraRTCClient} instance.
 *
 *  @param {string} mode - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/clientconfig.html#mode| streaming algorithm} used by Agora SDK.
 *  @param  {string} codec - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/clientconfig.html#codec| client codec} used by the browser.
 */

var client = AgoraRTC.createClient({
  mode: "rtc",
  codec: "vp8"
});
AgoraRTC.enableLogUpload();

/*
 *  Clear the video and audio tracks used by `client` on initiation.
 */



var localTracks = {
  videoTrack: null,
  audioTrack: null
};

/*
 *  On initiation no users are connected.
 */
var remoteUsers = {};
var urlParams = new URLSearchParams(window.location.search);
var channelName = urlParams.get('name');
console.log('Channel name:', channelName);
var channelType = urlParams.get('type');
// Use the channelType value here


/*
 *  On initiation. `client` is not attached to any project or channel for any specific user.
 */

var currentStream = null;
var response = $.ajax({
            url: '/token',
            type: 'POST',
            data: { channelName: channelName },
            async: false
        }).responseText;

response=JSON.parse(response);        
console.log(response["token"])

var options = {
  appid: "d19e2aacb0dd4f03be71a95d505f3cff",
  channel: response["channelname"],
  uid: 0,
  token:response["token"]

};
function copyString(string) {
  const textarea = document.createElement('textarea');
  textarea.value = string;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
$('#invite-button').click(function() {
    // get the invite URL
    var copyText = 'https://stream.grimreaper01.repl.co/invite/'+channelType+'/channel='+channelName ;
    copyString(copyText);
    alert("Url copied");
  });


window.addEventListener("beforeunload", function (event) {
  var y = $.ajax({
            url: '/delete',
            type: 'POST',
            data: { channelName: channelName },
            async: false
        }).responseText;
});


/*
 * When a user clicks Join or Leave in the HTML form, this procedure gathers the information
 * entered in the form and calls join asynchronously. The UI is updated to match the options entered
 * by the user.
 */
$("#join").click(async function (e) {
  await join();});
    
  

/*
 * Called when a user clicks Leave in order to exit a channel.
 */
$("#leave").click(function (e) {
  leave();
});

/*
 * Called when a user clicks Switch button to switch input stream.
 */
$("#switch-channel").click(function (e) {
  switchChannel();
});

var fileInput = document.getElementById('video-input');
  var videoPlayer = document.getElementById('sample-video');

  // When the file input changes, set the src of the video player to the selected file
  fileInput.addEventListener('change', function() {
    var file = fileInput.files[0];
    videoPlayer.src = URL.createObjectURL(file);
  });
/*
 * Join a channel, then create local video and audio tracks and publish them to the channel.
 */
async function join() {
  // Add an event listener to play remote tracks when remote user publishes.
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);

  // Default publish local microphone audio track to both options.
  localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  if (currentStream == "camera") {
    // Join a channel and create local tracks. Best practice is to use Promise.all and run them concurrently.
    [options.uid, localTracks.videoTrack] = await Promise.all([
    // Join the channel.
    client.join(options.appid, options.channel, options.token || null, options.uid || null),
    // Create tracks to the localcamera.
    AgoraRTC.createCameraVideoTrack()]);

    // Publish the local video and audio tracks to the channel.

    $("#joined-setup").css("display", "flex");
  } else {
    var videoFromDiv = document.getElementById("sample-video");
    // https://developers.google.com/web/updates/2016/10/capture-stream - captureStream() 
    // can only be called after the video element is able to play video;
    try {
      videoFromDiv.play();
    } catch (e) {
      console.log(error);
    }
    //specify mozCaptureStream for Firefox.
    var videoStream =videoFromDiv.captureStream();
    [options.uid, localTracks.videoTrack,localTracks.audioTrack] = await Promise.all([
    // Join the channel.
    client.join(options.appid, options.channel, options.token || null, options.uid || null),
    // Create tracks to the customized video source.
    
    AgoraRTC.createCustomVideoTrack({
      mediaStreamTrack: videoStream.getVideoTracks()[0]
    }),
    AgoraRTC.createCustomAudioTrack({
      mediaStreamTrack: videoStream.getAudioTracks()[0]
    })]);
  }
  await client.publish(Object.values(localTracks));
        
    
  console.log("publish success");
}

/*
 * Stop all local and remote tracks then leave the channel.
 */

async function stopCurrentChannel() {
  for (trackName in localTracks) {
    var track = localTracks[trackName];
    if (track) {
      track.stop();
      track.close();
      localTracks[trackName] = undefined;
    }
  }

  // Remove remote users and player views.
  remoteUsers = {};
  $("#remote-playerlist").html("");
  $("#local-player-name").text("");

  // leave the channel
  await client.leave();
  console.log("client leaves channel success");
}
async function leave() {
  await stopCurrentChannel();
  $("#join").attr("disabled", false);
  $("#leave").attr("disabled", true);
  $("#switch-channel").attr("disabled", true);
  $("#joined-setup").css("display", "none");
}

/*
 *
 */
async function switchChannel() {
  console.log("switchChannel entered");
  let prev = currentStream;
  currentStream = $("#stream-source").val();
  if (currentStream == prev) {
    console.log("no change from " + prev + " to" + currentStream);
  } else if (currentStream != prev) {
    console.log("channel is switched from " + prev + " to" + currentStream);
    await stopCurrentChannel().then(join());
    //await join();
    //TO-DO
  }
}

/*
 * Add the local use to a remote channel.
 *
 * @param  {IAgoraRTCRemoteUser} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to add.
 * @param {trackMediaType - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/itrack.html#trackmediatype | media type} to add.
 */

/*
 * Add a user who has subscribed to the live channel to the local interface.
 *
 * @param  {IAgoraRTCRemoteUser} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to add.
 * @param {trackMediaType - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/itrack.html#trackmediatype | media type} to add.
 */
function handleUserPublished(user, mediaType) {
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}

/*
 * Remove the user specified from the channel in the local interface.
 *
 * @param  {string} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to remove.
 */
function handleUserUnpublished(user, mediaType) {
  if (mediaType === 'video') {
    const id = user.uid;
    delete remoteUsers[id];
    $(`#player-wrapper-${id}`).remove();
  }
}