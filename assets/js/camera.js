let capturedImage = "";

async function capturePhoto() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream;

    const wrapper = document.createElement("div");
    wrapper.style.width = "100%";
    wrapper.style.padding = "0";
    wrapper.appendChild(video);

    Swal.fire({
      title: "Capture Photo",
      html: wrapper,
      showCancelButton: true,
      confirmButtonText: "Capture",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: async () => {
        await video.play();
      },
      preConfirm: () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        capturedImage = canvas.toDataURL("image/jpeg", 0.8);

        document.getElementById("photoPreview").innerHTML =
          `<img src="${capturedImage}" class="preview img-fluid">`;

        refreshPhotoButtonLabel();

        return true;
      }
    }).then(result => {
      stream.getTracks().forEach(t => t.stop());

      if (result.isConfirmed) {
        Swal.fire("Captured", "Photo has been added.", "success");
      }
    });
  } catch (err) {
    Swal.fire("Camera error", err.message || "Unable to access camera.", "error");
  }
}
