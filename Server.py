from flask import Flask, render_template, jsonify, request
import scipy.io.wavfile as wio
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
import csv


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
    pilImg = Image.fromarray(img[0])
    pilImg.save("temp\specgram.png")

    # music
    Music = np.loadtxt("data\\localized_160513_0_070110_16k001.wav\\spectrum.txt").transpose()
    im = plt.imshow(Music, extent=[0, 239.992, 180, -180], aspect="auto", interpolation="bilinear", alpha=0.7, cmap="jet")
    img = im.make_image(r)
    pilImg = Image.fromarray(img[0])
    pilImg.save("temp\music.png")

    return jsonify({"specgram": {
                        "img_path": "C:\\Users\\yamat\\Workspace\\hark_bird_app\\temp\\specgram.png",
                        #"img_path": "https://raw.githubusercontent.com/yamatakeru/image_src/master/specgram.png", ローカルリソースへアクセスできない為，動作確認用にgitに置いた画像を読む
                        "f_max": max(freq),
                        "t_max": max(bins)},
                    "music": {
                        "img_path": "C:\\Users\\yamat\\Workspace\\hark_bird_app\\temp\\music.png",
                        #"img_path": "https://raw.githubusercontent.com/yamatakeru/image_src/master/music.png",
                        "a_max": 200,
                        "t_max": max(bins)}
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
