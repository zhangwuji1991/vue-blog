import store from '../../store'
import fecth from './../../utils/fecth.js'
import $ from 'jquery'
const musicApi = {
    lastLyric: 0,
    lyric: {},    // 解析的歌詞
    maxProgressWidth: 0,
    dragProgressTo: 0,
    x: 0,  // x 的位置
    l: 0,  // offsetleft
    parseLrc (lrc) {
        if (lrc === '') return ''
        const lyrics = lrc.split('\n')
        let lrcObj = {}
        for (let i = 0; i < lyrics.length; i++) {
            // 解码
            const lyric = decodeURIComponent(lyrics[i])
            const timeReg = /\[\d*:\d*((\.|\:)\d*)*\]/g
            const timeRegExpArr = lyric.match(timeReg)
            if (!timeRegExpArr) continue
            const clause = lyric.replace(timeReg, '')
            for (let k = 0, h = timeRegExpArr.length; k < h; k++) {
                const t = timeRegExpArr[k]
                let min = Number(String(t.match(/\[\d*/i)).slice(1))
                let sec = Number(String(t.match(/\:\d*/i)).slice(1))
                const time = min * 60 + sec
                lrcObj[time] = clause
            }
        }
        return lrcObj
    },
    // 获取对应的表单歌曲
    getMusicSheet (id) {
        // const id = 3778678  // 云音乐热歌榜
        const apiUrl = `http://www.daiwei.org/vue/server/music.php?inAjax=1&do=playlist&id=${id}`
        fecth.get(apiUrl, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then((res) => {
            // console.log(JSON.stringify(res.data.result.songs))
            // that.musicInfo = res.data.playlist.tracks
            store.dispatch({
                type: 'set_MusicSheetList',
                data: res.data.playlist.tracks
            })
            store.dispatch({
                type: 'set_MusicList',
                data: res.data.playlist.tracks
            })
        }, (err) => {
            console.log(err)
        })
    },

    // 获取专辑信息
    getAlbum (id) {
        const apiUrl = `http://www.daiwei.org/vue/server/music.php?inAjax=1&do=album&id=${id}`
        fecth.get(apiUrl, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then((res) => {
            // that.musicInfo = res.data.playlist.tracks
            store.dispatch({
                type: 'set_MusicSheetList',
                data: res.data.songs
            })
            store.dispatch({
                type: 'set_MusicList',
                data: res.data.songs
            })
        }, (err) => {
            console.log(err)
        })
    },

    // 获取歌词
    getMusicLrc (data, that) {
        const ele = store.getters.getAudioEle
        // alert(data.id)
        const apiLyric = `http://www.daiwei.org/vue/server/music.php?inAjax=1&do=lyric&id=${data.id}`
        fecth.get(apiLyric).then((res) => {
            let parseLrc = {}
            if (res.data.lrc === undefined) {
                parseLrc = {'0': '纯音乐,请欣赏'}
            } else {
                parseLrc = this.parseLrc(res.data.lrc.lyric)
                this.lyric = this.parseLrc(res.data.lrc.lyric)
            }

            // 初始化最後一個lrc
            this.lastLyric = -1
            const currentMusic = {
                id: data.id,
                name: data.name,
                url: musicApi.replaceUrl(data.url),
                singer: data.singer,
                duration: data.duration,
                picurl: data.picurl,
                index: data.musicndex,
                lyric: parseLrc,
                lrcContent: store.getters.getAudioLrcContent
            }
            store.commit({
                type: 'setCurrentAudio',
                data: currentMusic
            })

            if (data.type !== 'unupdate' && data.type === undefined) {
                // alert(1)
                store.dispatch({
                    type: 'set_MusicPlayList',
                    data: data.list
                })
            }
            that.$nextTick(() => {
                try {
                    store.getters.getAudioEle.load()
                    store.getters.getAudioEle.play()
                } catch (e) {
                    return
                }
                // 设置歌词位置
                store.commit({
                    type: 'setAudiolrcIndex',
                    data: 0
                })
                $('.lrc-content').stop().animate({scrollTop: 0}, 1000)
                // 设置播放状态
                store.commit('setAudioIsPlay', !ele.paused)
            })
        }, (err) => {
            console.log(err)
        })
    },
    // 获取音乐时长
    getMusicDurantionType (time) {
        const minT = Math.floor(time / 1000 / 60) >= 10 ? Math.floor(time / 1000 / 60) : '0' + Math.floor(time / 1000 / 60)
        const minS = Math.floor(time / 1000 % 60) >= 10 ? Math.floor(time / 1000 % 60) : '0' + Math.floor(time / 1000 % 60)
        return minT + ':' + minS
    },

    // 刷新進度的歌詞
    refreshLyric (time, that) {
        if (this.lyric === '') return false
        time = parseInt(time)  // 时间取整
        var i = 0
        for (var k in this.lyric) {
            if (k >= time) break
            i = k      // 记录上一句的
        }
        this.scrollLyric(i, that)
    },

    // 滚动歌词到指定句
    // 参数：当前播放时间（单位：秒）
    scrollLyric (time, that) {
        // aler)
        if (this.lyric === '') return false

        time = parseInt(time)  // 时间取整

        if (this.lyric === undefined || this.lyric[time] === undefined) return false  // 当前时间点没有歌词

        if (this.lastLyric === time) return true // 歌词没发生改变

        var i = 0  // 获取当前歌词是在第几行

        // 将此行数 放入vuex
        store.commit({
            type: 'setAudiolrcIndex',
            data: i
        })

        for (var k in this.lyric) {
            if (k > time) break
            i++
        }
        this.lastLyric = time  // 记录方便下次使用
        // $(".lplaying").removeClass("lplaying")     // 移除其余句子的正在播放样式
        // $(".lrc-item[data-no='" + i + "']").addClass("lplaying")    // 加上正在播放样式
        // 再次添加 放入vuex
        store.commit({
            type: 'setAudiolrcIndex',
            data: i
        })

        try {
            var scroll = (document.getElementsByClassName('lrc-item')[0].offsetHeight * i) - store.getters.getAudioLrcContent.offsetHeight / 2
            $('.lrc-content').stop().animate({scrollTop: scroll}, 1000)
        } catch (e) {
            return
        }
    },

    // 点击播放歌曲
    clickIndex (data, that) {
        const apiUrl = `http://www.daiwei.org/vue/server/music.php?inAjax=1&do=musicInfo&id=${data.id}`
        fecth.get(apiUrl).then((res) => {
            // 如果代码不允许被播放（付费音乐）
            if (res.data.data[0].url === null) {
                let initIndex = 0
                const currentMusic = {
                    index: store.getters.getCurrentAudio.index ? store.getters.getCurrentAudio.index + 1 : initIndex + 1
                }
                store.commit({
                    type: 'setCurrentAudio',
                    data: currentMusic
                })
                this.playNextPrev(that, true)
                return
            }
            const newData = {
                id: data.id,
                name: data.name,
                url: musicApi.replaceUrl(res.data.data[0].url),
                singer: data.singer,
                duration: data.duration,
                picurl: data.pic,
                musicndex: data.index,
                list: data.list,
                type: data.type
            }
            this.getMusicLrc(newData, that)
            // console.log(JSON.stringify(res.data.result.songs))
            // this.musicInfo = res.data.result.songs
        }, (err) => {
            console.log(err)
        })
    },

    // 搜索音乐
    searchMusic (word, pages, that) {
        const apiUrl = `http://www.daiwei.org/vue/server/music.php?inAjax=1&do=search&count=20&pages=${pages}&name=${word}`
        fecth.get(apiUrl, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then((res) => {
            try {
                res.data.result.songs.forEach((value, index, array) => {
                    that.searchMusicList.push(value)
                })
                store.dispatch({
                    type: 'set_MusicSearchList',
                    data: that.searchMusicList
                })
                store.dispatch({
                    type: 'set_MusicList',
                    data: that.searchMusicList
                })
            } catch (e) {
                return
            }
        }, (err) => {
            console.log(err)
        })
    },

    scrollAnimate (ele, position) {
        var t = setInterval(function () {
            ele.scrollTop = ele.scrollTop + 2
            if (ele.scrollTop >= position) {
                clearInterval(t)
            }
        }, 1)
    },

    // 添加到我喜欢的音乐 使用本地存储的方法
    collectMusic (opt) {
        // set_MusicCollectList
        let collectlist = store.getters.getMusicCollectList === null ? [] : store.getters.getMusicCollectList
        let insertMusic = true
        if (collectlist) {
            collectlist.forEach((v, i, a) => {
                if (opt.id === v.id) {
                    insertMusic = false
                    return
                }
            })
        }

        if (insertMusic) {
            collectlist.unshift(opt)
            localStorage.setItem('musicCollectList', JSON.stringify(collectlist))
        }
    },

    // 获取本地的音乐
    getLocalMusic () {
        const localmusic = localStorage.getItem('musicCollectList')
        store.commit({
            type: 'setMusicCollectList',
            data: JSON.parse(localmusic)
        })
    },

    // 删除收藏的音乐
    deleteMusic (id) {
        let collectlist = store.getters.getMusicCollectList
        collectlist.forEach((v, i, a) => {
            if (id === v.id) {
                collectlist.splice(i, 1)
                return
            }
        })
        store.commit({
            type: 'setMusicCollectList',
            data: collectlist
        })
        localStorage.setItem('musicCollectList', JSON.stringify(collectlist))
    },

    // 播放暂停
    playPause () {
        try {
            const ele = store.getters.getAudioEle
            if (!(ele.src.indexOf('.mp3') > 0)) return
            if (ele.paused) {
                ele.play()
            } else {
                ele.pause()
            }
            store.commit('setAudioIsPlay', !ele.paused)
        } catch (e) {
            return
        }
    },
    // 播放下一曲  可调用clickPlayindex  更换index 即可 (第2个参数为 true 或者 false  true表示下一首  false 表示上一首     第3个参数是判断是不是正在播放的音乐触发更新音乐列表    如果是正在播放的音乐点击播放index 的歌曲  和 自动播放 手动播放下一首 则不触发重新填充数据的操作)
    playNextPrev (that, isNext) {
        // alert(store.getters.getCurrentAudio.index)
        // alert(store.getters.getMusicPlayList.length)
        let index = store.getters.getCurrentAudio.index || 0
        const length = store.getters.getMusicPlayList.length || 0
        const musicplaylist = store.getters.getMusicPlayList || []
        if (isNext) {
            index++
            if (index > length - 1) {
                index = 0
            }
        } else {
            index--
            if (index < 0) {
                index = length - 1
            }
        }
        const apiUrl = `http://www.daiwei.org/vue/server/music.php?inAjax=1&do=musicInfo&id=${musicplaylist[index].id}`
        fecth.get(apiUrl).then((res) => {
            if (res.data.data[0].url === null) {
                let initIndex = 0
                const currentMusic = {
                    index: store.getters.getCurrentAudio.index ? (isNext ? store.getters.getCurrentAudio.index + 1 : store.getters.getCurrentAudio.index - 1) : (isNext ? initIndex + 1 : initIndex)
                }
                store.commit({
                    type: 'setCurrentAudio',
                    data: currentMusic
                })
                this.playNextPrev(that, isNext)
                return
            }
            const newData = {
                id: musicplaylist[index].id,
                name: musicplaylist[index].name,
                url: musicApi.replaceUrl(res.data.data[0].url),
                singer: musicplaylist[index].ar[0].name,
                duration: musicApi.getMusicDurantionType(musicplaylist[index].dt),
                picurl: musicplaylist[index].al.picUrl,
                musicndex: index,
                list: store.getters.getMusicList,
                type: 'unupdate'
            }
            this.getMusicLrc(newData, that)
        }, (err) => {
            console.log(err)
        })
    },
    // 初始化音乐事件
    initAudioEvent (that) {
        // const _this = this
        // audio Dom元素
        const ele = store.getters.getAudioEle
        // const _this = this
        // 本地音乐初始化  （收藏的歌曲）
        this.getLocalMusic()

        ele.onloadedmetadata = () => {
        }

        // 音乐播放结束事件
        ele.onended = () => {
            this.playNextPrev(that, true)
        }
        ele.ontimeupdate = function () {
            if (!that.isDrag) {
                const ele = store.getters.getAudioEle
                const duration = Math.floor(ele.duration)
                const currentT = Math.floor(ele.currentTime)
                musicApi.scrollLyric(currentT, that)
                // 设置currentT
                store.dispatch('set_AudioCurrentTime', currentT)
                // 设置duration
                store.dispatch('set_AudioCurrentD', currentT / duration * 100)
            }
        }
        // 监听缓冲的进度
        ele.onprogress = function () {
            const durationT = Math.floor(ele.duration)
            try {
               if (ele.buffered.length > 0) {
                    var bufferedT = 0
                    for (var i = 0; i < ele.buffered.length; i++) {
                        bufferedT += ele.buffered.end(i) - ele.buffered.start(i)
                        if (bufferedT > durationT) {
                            bufferedT = durationT
                            console.log('缓冲完成')
                        }
                    }
                    var bufferedP = Math.floor((bufferedT / durationT) * 100)
                    that.bufferingP = bufferedP
               }
            } catch (e) {
                return
            }
        }
        // ele.onabort = function () {
        //     this.playNextPrev(that, true)
        // }
    },
    dragMouseDown (that, event) {
        const ele = store.getters.getAudioEle
        if (ele.src.indexOf('.') < 0) return
        var _this = this
        that.isDrag = true
        let e = event || window.event
        var x = e.clientX
        let l = e.target.offsetLeft
        _this.maxProgressWidth = document.getElementById('music_progressD').offsetWidth
        const moveProgress = document.getElementById('music_progress')
        // console.log(this.maxProgressWidth)
        moveProgress.onmousemove = function (event) {
            if (that.isDrag) {
                let e = event || window.event
                let thisX = e.clientX
                _this.dragProgressTo = Math.min(_this.maxProgressWidth, Math.max(0, l + (thisX - x)))
                _this.updateDragProgress(that, _this.maxProgressWidth, _this.dragProgressTo)
                console.log(_this.dragProgressTo)
                console.log(_this.maxProgressWidth)
            }
        }
        moveProgress.onmouseup = function (event) {
            const durationT = ele.duration
            if (that.isDrag) {
                that.isDrag = false
                ele.currentTime = Math.floor(_this.dragProgressTo / _this.maxProgressWidth * durationT)
            }
        }
        moveProgress.onmouseleave = function (event) {
            const durationT = ele.duration
            if (that.isDrag) {
                that.isDrag = false
                ele.currentTime = Math.floor(_this.dragProgressTo / _this.maxProgressWidth * durationT)
            }
        }
    },
    dragTouchStart (that, event) {
        const ele = store.getters.getAudioEle
        if (ele.src.indexOf('.') < 0) return
        const _this = this
        that.isDrag = true
        const e = event || window.event
        _this.x = e.touches[0].clientX
        _this.l = e.target.offsetLeft
        _this.maxProgressWidth = document.getElementById('music_progressD').offsetWidth
        // console.log(this.maxProgressWidth)
    },
    dragTouchMove (that, event) {
        const _this = this
        if (that.isDrag) {
            let e = event || window.event
            let thisX = e.touches[0].clientX
            _this.dragProgressTo = Math.min(_this.maxProgressWidth, Math.max(0, _this.l + (thisX - _this.x)))
            _this.updateDragProgress(that, _this.maxProgressWidth, _this.dragProgressTo)
        }
    },
    dragTouchEnd (that, event) {
        const _this = this
        const ele = store.getters.getAudioEle
        const durationT = ele.duration
        if (that.isDrag) {
            that.isDrag = false
            ele.currentTime = Math.floor(_this.dragProgressTo / _this.maxProgressWidth * durationT)
        }
    },
    // 拖动  点击的进度效果   l length  to 移动的位置
    updateDragProgress (that, l, to) {
        const ele = store.getters.getAudioEle
        const durationT = ele.duration
        // const duration = Math.floor(ele.duration)
        // const currentT = Math.floor(ele.currentTime)
        musicApi.scrollLyric(Math.floor(to / l * durationT), that)
        // 设置currentT
        store.dispatch('set_AudioCurrentTime', Math.floor(to / l * durationT))
        // 设置duration
        store.dispatch('set_AudioCurrentD', (Math.floor(to / l * durationT)) / durationT * 100)
        // console.log(currentT + ' ---- ' + duration)
    },

    clickProgress (event) {
        const ele = store.getters.getAudioEle
        const durationT = ele.duration
        const e = event || window.event
        const l = e.offsetX
        const w = document.getElementById('music_progressD').offsetWidth
        console.log(l + '------------' + w)
        ele.currentTime = Math.floor(l / w * durationT)
    },

    // 由于网易云地址有添加防盗链  m8c,m7c 的地址替换成m8,m7 就可以正常播放
    replaceUrl (url) {
        return url.indexOf('//m7c') < 0 ? (url.indexOf('//m8c') ? url.replace('//m8c', '//m8') : url) : url.replace('//m7c', '//m7')
    }
}

export default musicApi
