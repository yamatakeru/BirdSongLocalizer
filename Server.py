from flask import Flask, render_template, jsonify, request
import subprocess
import scipy.io.wavfile as wio
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
import csv
import os
import glob


app = Flask(__name__, static_folder="./build/static", template_folder="./build")

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/getSpectrumImg", methods=['GET'])
def getSpectrumImg():
    r = plt.gcf()
    # specgram

    rate, data = wio.read("data\\localized_160513_0_070110_16k001.wav\\remixed.wav")
    pxx, freq, bins, im = plt.specgram(data, Fs = rate, cmap="jet")
    img = im.make_image(r)
    pilImg = Image.fromarray(np.flipud(img[0]))
    pilImg.save("build\\static\\media\\spectrogram.png")

    dt = int(img[0].shape[1] / (max(bins) / 30))
    left = 0
    right = 2 * dt
    sp_num = 0
    sp_simg_paths = []
    while True:
        if right >= img[0].shape[1]:
            right = img[0].shape[1]
            sp_simg_name = f"spectrogram_{sp_num}.png"
            im_crop = pilImg.crop((left, 0, right, img[0].shape[0]))
            im_crop.save("build\\static\\media\\" + sp_simg_name)
            sp_simg_paths.append("http://127.0.0.1:5000/static/media/" + sp_simg_name)
            break
        else:
            im_crop = pilImg.crop((left, 0, right, img[0].shape[0]))
            im_crop = pilImg.crop((left, 0, right, img[0].shape[0]))
            sp_simg_name = f"spectrogram_{sp_num}.png"
            im_crop = pilImg.crop((left, 0, right, img[0].shape[0]))
            im_crop.save("build\\static\\media\\" + sp_simg_name)
            sp_simg_paths.append("http://127.0.0.1:5000/static/media/" + sp_simg_name)
            sp_num += 1
            left += dt
            right += dt

    #res = subprocess.run(["sox", "data\\localized_160513_0_070110_16k001.wav\\remixed.wav", "-n", "spectrogram", "-r", "-o", "build\\static\\media\\spectrogram.png"])
    #print(res)

    # music
    Music = np.loadtxt("data\\localized_160513_0_070110_16k001.wav\\spectrum.txt").transpose()
    im = plt.imshow(Music, extent=[0, 239.992, 180, -180], aspect="auto", interpolation="bilinear", alpha=0.7, cmap="jet")
    img = im.make_image(r)
    pilImg = Image.fromarray(img[0])
    pilImg.save("build\\static\\media\\music.png")

    dt = int(img[0].shape[1] / (max(bins) / 30))
    left = 0
    right = 2 * dt
    sp_num = 0
    sp_mimg_paths = []
    while True:
        if right >= img[0].shape[1]:
            right = img[0].shape[1]
            im_crop = pilImg.crop((left, 0, right, img[0].shape[0]))
            sp_mimg_name = f"music_{sp_num}.png"
            im_crop = pilImg.crop((left, 0, right, img[0].shape[0]))
            im_crop.save("build\\static\\media\\" + sp_mimg_name)
            sp_mimg_paths.append("http://127.0.0.1:5000/static/media/" + sp_mimg_name)
            break
        else:
            im_crop = pilImg.crop((left, 0, right, img[0].shape[0]))
            sp_mimg_name = f"music_{sp_num}.png"
            im_crop = pilImg.crop((left, 0, right, img[0].shape[0]))
            im_crop.save("build\\static\\media\\" + sp_mimg_name)
            sp_mimg_paths.append("http://127.0.0.1:5000/static/media/" + sp_mimg_name)
            sp_num += 1
            left += dt
            right += dt

    _ = subprocess.run(["cp", "data/localized_160513_0_070110_16k001.wav/sep_*.wav", "build/static/media"])
    retval = os.getcwd()
    os.chdir("build\\static\\media")
    sound_source_paths = []
    for f in glob.glob("sep_*.wav"):
        sound_source_paths.append("http://127.0.0.1:5000/static/media/" + f)
    os.chdir(retval)
    
    return jsonify({"specgram": {
                        "img_path": "http://127.0.0.1:5000/static/media/spectrogram.png",
                        "sp_img_paths": sp_simg_paths,
                        "f_max": max(freq),
                        "t_max": max(bins),
                        "sp_num": sp_num,
                        "dt_num": dt},
                    "music": {
                        "img_path": "http://127.0.0.1:5000/static/media/music.png",
                        "sp_img_paths": sp_mimg_paths,
                        "a_max": 200,
                        "t_max": max(bins),
                        "sp_num": sp_num,
                        "dt_num": dt},
                    "sound_source_paths": sound_source_paths
                    })


@app.route("/api/getLocalizedData", methods=['GET'])
def getLocalizedData():    
    # localized data
    localized_data = None
    with open("data\\localized_160513_0_070110_16k001.wav\\sourceinfo.csv", "r") as f:
        reader = csv.reader(f, delimiter="\t")
        localized_data = [row for row in reader]

    return jsonify({"localized_data": localized_data})


@app.route("/api/sendAnnotationData", methods=['POST'])
def sendAnnotationData():
    data = request.get_json()
    print(data)
    with open("data\\savetest.csv", "w", newline="") as f:
        writer = csv.writer(f, delimiter='\t')
        writer.writerows(data)

    return jsonify({"res": "ok!"})


if __name__ == "__main__":
    app.debug = True
    app.run(host="localhost")
