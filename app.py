from flask import Flask, render_template, jsonify
from streamy_core import *

app = Flask(__name__)

# 复用Lab11已经写好的测试对象
# 初始化测试数据
actor1 = Actor("Ashley Peacock")
actor2 = Actor("Eddy Gerbil")
sci_fi = Genre("Sci‑Fi")
stranger_show = TVShow("Stranger Things",2016,"Netflix")
s1 = Season(1)
ep1 = Episode("Chapter One: The Vanishing of Will Byers", 2880)
s1.add_episode(ep1)
stranger_show.add_season(s1)
stranger_show.link_actor(actor1)
stranger_show.link_actor(actor2)
sci_fi.register_title(stranger_show)


@app.route('/')
def index():
    """主页网页"""
    return render_template("index.html")

@app.route("/api/media-info")
def api_media_info():
    """接口：返回剧集信息"""
    data = {
        "name": stranger_show.name,
        "release_year": stranger_show.release_year,
        "network": stranger_show.network,
        "seasons_count": len(stranger_show.seasons),
        "actors": [a.full_name for a in stranger_show.cast_actors]
    }
    return jsonify(data)

@app.route("/api/play/<token>")
def api_play(token):
    """调用原有play_media播放鉴权逻辑"""
    result = stranger_show.play_media(token)
    return jsonify({"success": result, "token_used": token})


if __name__ == "__main__":
    app.run(debug=True)
