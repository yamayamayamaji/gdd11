webGameSolver = {
	/**
	 * 初期処理
	 */
	init: function(){
		var scrMgr = this.pageScriptMgr;
		var pageScr = scrMgr.scripts;
		//DOMからページスクリプトにアクセスし、ソースを取得
		for (var i=0, len=pageScr.length, s; i<len; i++) {
			s = pageScr[i];
			//外部js読込タグ(jqueryは事前に読み込んであるので無視)
			if (s.src && !s.src.match(/jquery/ig)) {
				$.post(s.src, null, function(idx){
					return function(response){
						return scrMgr.afterLoad.apply(scrMgr, [idx, response]);
					};
				}(i));
			//script直書きタグ
			} else {
				scrMgr.afterLoad(i, s.text);
			}
		}
	},

	/**
	 * ページスクリプト管理オブジェクト
	 * (content scriptからアクセス出来ないweb page内のスクリプトを管理)
	 */
	pageScriptMgr: {
		scripts: document.scripts,
		loaded: 0,
		sorces: [],
		afterLoad: function(idx, sorce){
			this.sorces[idx] = sorce;
			this.loaded++;
			//全てのスクリプトソースを取得できたら、ソルバを起動
			if (this.loaded==this.scripts.length) {
				webGameSolver.solve();
			}
		}
	},

	/**
	 * ソルバ
	 */
	solve: function(){
		var scrMgr = this.pageScriptMgr,
			fliped = [];
		//取得したスクリプトソースを現在の(content scriptの)コンテキストで実行
		//(これでページスクリプト内のconcオブジェクトと同様のオブジェクトが利用できるようになる)
		for (var i=0, len=scrMgr.sorces.length; i<len; i++) {
			eval(scrMgr.sorces[i]);
		}
		//スクリプトタグ内をスクレイピングし、カードの配色を取得
		//(全部のカードをクリックしてみるのは面倒なので…)
		eval('var cards = [' + scrMgr.scripts[2].text.replace(/(\r|\n)/g,'').replace(/.+conc\.setup\(\[([^\]]+)].+/g, '$1') + ']');

		for (var i=0, len=cards.length; i<len; i++) {
			if (fliped.indexOf(i) >= 0) { continue; }
			//とりあえず1枚カードをめくる
			conc.flip(i);
			for (var j=i+1; j<len; j++) {
				//同じ色のカードが見つかったら
				if (cards[i]==cards[j]) {
					//そのカードをめくる
					conc.flip(j);
					fliped.push(i, j);
					break;
				}
			}
		}
	}
};

webGameSolver.init();
