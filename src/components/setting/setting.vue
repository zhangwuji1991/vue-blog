<template>
  <div class="setting">
  	<!-- <div class="set_bg" v-if="getGlobalInfo.contentInfo" :style="{backgroundColor:getGlobalInfo.contentInfo.bgcolor, opacity : getGlobalInfo.contentInfo.opacity}"></div> -->
  	<div class="setting-warpper g-content">
  		<h3 class="title">设置</h3>
  		<div class="set_list border-1px">
  			<span class="name">背景图片</span>
			<div class="switch_bg switch-right">
  				<div class="title">{{getImageInfoTitle}}</div>
				<v-switch :options="options" @selectBgType="selectBgType"></v-switch>
			</div>
  		</div>
  		<div class="set_list border-1px">
  			<span class="name">背景色</span>
			<div class="switch_bg switch-right">
  				<div class="colorArea" :style="{backgroundColor:getGlobalInfo.contentInfo.bgcolor}" @click="setBgColorPicker"></div>
			</div>
  		</div>
  		<div class="set_list border-1px">
  			<span class="name">透明度</span>
			<div class="switch_bg switch-right">
  				<div class="title" v-show="!showOpacityInput" @click="showInputOpacity">{{getGlobalInfo.contentInfo.opacity}}</div>
  				<input class="inputText" ref="inputBgOpacity" type="text" v-show="showOpacityInput" @keyup.enter="onEnter($event)" placeholder="0-1,回车确认" :value="getGlobalInfo.contentInfo.opacity" @blur="closeInputOpacity">
			</div>
  		</div>
  		<div class="set_list">
  			<span class="name center" @click="clearSettingInfo">重置所有设置</span>
  		</div>
  	</div>
  	<div class="selectBg" v-show="showSetBgColorPicker">
		<colorpicker @isclose="closeColorPicker"></colorpicker>
	</div>
  </div>
</template>
<script>
  import store from './../../store'
  import Switch from './../switch/switch.vue'
  import ColorPicker from './../common/colorpicker/colorpicker.vue'
  export default {
  	data () {
  		return {
  			options: {
				isactive: false,
				rangebg: '#aaa',
				rangeactivebg: '#F2301A',
				contentbg: '#fff',
				ref: 'bg'
			},
			showSetBgColorPicker: false,
			showOpacityInput: false
		}
	},
	methods: {
		selectBgType (info) {
			if (info.ref === 'bg') {
				store.dispatch({
					type: 'set_ShowBingImage',
					data: info.active
				})
			}
		},
		getIsActive () {
			const getAllStorage = JSON.parse(localStorage.getItem('globalInfo'))
			if (!(getAllStorage === null || '')) {
				this.options.isactive = getAllStorage.showBingImage
			} else {
				this.options.isactive = store.getters.getGlobalInfo.showBingImage
			}
		},
		setBgColorPicker () {
			this.showSetBgColorPicker = true
		},
		closeColorPicker () {
			this.showSetBgColorPicker = false
		},
		showInputOpacity () {
			this.showOpacityInput = true
			this.$nextTick(() => {
				this.$refs.inputBgOpacity.focus()
			})
		},
		closeInputOpacity () {
			this.showOpacityInput = false
		},
		onEnter (e) {
			if (e.target.value >= 0 && e.target.value <= 1) {
				store.dispatch({
					type: 'set_GlobaBglColorOpacity',
					data: e.target.value
				})
				this.showOpacityInput = false
				localStorage.setItem('globalInfo', JSON.stringify(store.getters.getGlobalInfo))
			} else {
				alert('抱歉,输入框内是0-1 的整数或者小数点后两位的小数,请输入正确的格式')
			}
		},
		// 清除默认设置
		clearSettingInfo () {
			if (window.localStorage) {
				localStorage.removeItem('globalInfo')
				localStorage.removeItem('fixedImageBg')
				window.location.reload()
			}
		},
		getRoutePath () {
			// return this.$route.path
			// if (this.$route.path.indexOf('/about'))
			// 进入子页面的时候  路由路径的长度  来判断实在子路由还是父路由中
			if (this.$route.path === '/setting') {
				// 更新
				this.getIsActive()
			} else {
				return
			}
		}
	},
	computed: {
		getGlobalInfo () {
			return store.getters.getGlobalInfo
		},
		getImageInfo () {
			return store.getters.getGlobalInfo.showBingImage
		},
		getImageInfoTitle () {
			return store.getters.getGlobalInfo.showBingImage ? 'bing壁纸' : '自定义壁纸'
		}
	},
  	components: {
  		'v-switch': Switch,
  		'colorpicker': ColorPicker
  	},
  	watch: {
		'$route': 'getRoutePath'
	},
  	mounted () {
  		this.getIsActive()
  	}
  }
</script>
<style lang="stylus" rel="stylesheet/stylus">
@import '../../common/stylus/global.styl'
@import '../../common/stylus/style.styl'
@import '../../common/stylus/border-1px/index.styl'
	.setting
		position:fixed
		top:0
		left:0
		bottom:0
		width:100%
		right:0
		border-radius:12px
		.set_bg
			position:absolute
			top:0
			left:0;
			bottom:0
			width:100%
			right:0
			z-index:-1
		.setting-warpper
			// position:fixed
			// top:100px
			// bottom:50px
			left:50%
			max-width:1240px
			width:100%
			transform:translate(-50%,0)
			margin:0 auto
			overflow-y: auto
			box-sizing:border-box
			-webkit-overflow-scrolling: touch
			padding:15px;
			// background:red
			.title
				color:$text_color
				margin:0
			.set_list
				padding:10px 0
				color:$text_color
				font-size:0
				&.border-1px
					border-1px($border_bottom_color_deep, bottom)
				.name
					display:inline-block
					font-size:16px
					vertical-align:middle
					width: calc(100% - 150px)
					&.center
						font-size:14px
						text-align:center
						width:100%
						display:block
						cursor:pointer
				.switch-right
					display:inline-block
					vertical-align:middle
					font-size:0
					float: right
					.title
						display:inline-block
						vertical-align:middle
						font-size:14px
						margin-right: 10px
						color:$text_color_active
						min-width:50px
						text-align:center
					.switch
						display:inline-block
						vertical-align:middle
					.colorArea
						display:inline-block
						vertical-align:middle
						font-size:14px
						margin-right: 10px
						width:50px
						height:30px
						cursor:pointer
					.inputText
						display: inline-block;
						vertical-align: middle;
						font-size: 14px
						margin-right: 10px
						color: #666
						min-width: 50px
						text-align: center
						outline:none
						width:120px
						height:32px
						margin:0
						border: none
						box-sizing:border-box
		.selectBg
			position:fixed
			width:100%
			height:100%
			top:0
			left:0
			border-radius: 8px
			z-index:1
			background:rgba(0,0,0,0.3)
			display:flex
			align-items:center
</style>
