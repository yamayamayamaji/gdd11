/**
* ユーティリティ
*/
Object.extend = function(destination, source) {
	for (property in source) {
		if(source.hasOwnProperty(property)){
			destination[property] = source[property];
		}
	}
	return destination;
};
Object.prototype.extend = function(object) {
	return Object.extend.apply(this, [this, object]);
};

/**
* スライドパズル
*/
var SlidePuzzle = function(){};
SlidePuzzle.prototype.extend({
	EMP: '0',
	WALL: '=',
	getReversSteps: function(w, h){
		var ret = 0;
		var p = w * h;
		if (p < 16) {
			ret = 15;
		} else if (p < 19) {
			ret = 13;
		} else if (p < 20) {
			ret = 10;
		} else if (p < 25) {
			ret = 0;
		} else if (p < 30) {
			ret = 3;
		} else {
			ret = 2;
		}
		return ret;
	},
	/**
	* 初期処理
	*/
	init: function(prob){
		this.ep = prob.bi.search(this.EMP);
		this.wi = prob.wi - 0;
		this.hi = prob.hi - 0;
		this.bi_s = prob.bi;
		this.bi_a = this.bi_s.split('');
		this.goal = this.getGoal(this.bi_s);
		this.reversSteps = this.getReversSteps(this.wi, this.hi);
		this.taskQue = [];
		this.boardHash = {};

		this.fields = new Array(this.bi_s.length);
		this.scdRowMinPos = this.wi;
		this.lastRowMinPos = this.fields.length - this.wi;
		//0がそのフィールドにあるときに可能な操作を格納
		var dset;
		for (var i=0, len=this.fields.length; i<len; i++) {
			dset = 'UDLR';
			//壁
			if (this.bi_a[i] == this.WALL) {
				this.fields[i] = { dset: '' };
				continue;
			}
			//上がフレームか壁
			if (i < this.scdRowMinPos || this.bi_a[i - this.wi] == this.WALL) {
				dset = dset.replace('U', '');
			}
			//下がフレームか壁
			if (i >= this.lastRowMinPos || this.bi_a[i + this.wi] == this.WALL) {
				dset = dset.replace('D', '');
			}
			//左がフレームか壁
			if (i % this.wi == 0 || this.bi_a[i - 1] == this.WALL) {
				dset = dset.replace('L', '');
			}
			//右がフレームか壁
			if (i % this.wi == this.wi - 1 || this.bi_a[i + 1] == this.WALL) {
				dset = dset.replace('R', '');
			}
			this.fields[i] = { dset: dset };
		}
		//一手目を探索キューに追加
		this.addTaskQue(this.bi_s, this.getMovable(this.ep), '', 1);

		//ゴールから逆算した盤面をハッシュに記憶
		this.goalAreaHash = this.getLoadToGoal(this.reversSteps);
	},

	/**
	* 後処理
	*/
	finish: function(){
		delete this.ep;
		delete this.wi;
		delete this.hi;
		delete this.bi_s;
		delete this.bi_a;
		delete this.goal;
		delete this.taskQue;
		delete this.boardHash;
		delete this.goalAreaHash;
		delete this.subSP;
	},

	/**
	* ゴールから逆算した状態を取得
	*/
	getLoadToGoal: function(steps){
		var goal_bs = this.goal, res;
		var loadToGoal = {},
			loadFromGoal, allLoadFromGoal = [],
			newLoadFromGoal = [{ bs: this.goal, root: ''}];
		//ゴールからsteps数だけ逆に戻る
		for (var step=0; step<steps; step++) {
			loadFromGoal = newLoadFromGoal;
			newLoadFromGoal = [];
			for (var i=0, task; i<loadFromGoal.length; i++) {
				task = loadFromGoal[i];
				var opes = this.getMovable(this.getEmpPos(task.bs), task.root.slice(-1));
				for (var j=0; j<opes.length; j++) {
					res = this.takeATrun(task.bs, opes[j], this.bi_s, goal_bs);
					newLoadFromGoal.push({bs: res.bs, root: task.root + res.ope});
					allLoadFromGoal.push({bs: res.bs, root: task.root + res.ope});
				}
			}
			if (res.final) { break; }
		}
		//ゴールからの経路を逆順(ゴールまでの経路)にして格納
		for (i=0, len_i=allLoadFromGoal.length; i<len_i; i++) {
			var load = allLoadFromGoal[i],
				revers = '';
			for (j=0, len_j=load.root.length; j<len_j; j++) {
				revers += this.getReverseDir(load.root.substr(-(j+1), 1));
			}
			if (!loadToGoal[load.bs] || loadToGoal[load.bs].length < revers) {
				loadToGoal[load.bs] = revers;
			}
		}
		return loadToGoal;
	},

	/**
	* 解答処理
	*/
	solve: function(prob){
		var BOARD_STATE = 0;
		var OPE = 1;
		var ROOT = 2;
		var DEPTH = 3;
		//当面は問題を限定しておく...
//		if (prob.wi * prob.hi > 20 /*|| prob.bi.match(/\=/)*/) {
//		if (prob.wi * prob.hi <= 12 || prob.wi * prob.hi > 20) {
//			return 'pass';
//		}

		//初期処理
		this.init(prob);

		var cnt = 0, r_cnt = 0, task, resMove, ope, len, ep, newProb;
		//探索キューを順に処理
		while (this.taskQue.length && cnt++ < 100000 && r_cnt < 3) {

			task = this.taskQue.shift();		//0:board state, 1:ope, 2:root, 3:depth
			for (var i=0, len=task[OPE].length; i<len; i++) {
				ope = task[OPE][i];
				//一手実行
				resMove = this.takeATrun(task[BOARD_STATE], ope, this.goal, task[BOARD_STATE]);
				ep = this.getEmpPos(resMove.bs);
				//とりあえずゴールしたら終了
				if (resMove.bs == this.goal) {
					return '' + task[ROOT] + resMove.ope;
					break;
				//ゴールへの経路が分かっている地点まで来た場合
				} else if (this.goalAreaHash[resMove.bs]) {
					return '' + task[ROOT] + resMove.ope + this.goalAreaHash[resMove.bs];
					break;
				//まだゴールできない場合
				} else {
					if (!this.boardHash[resMove.bs]) {
						//次の手を探索キューに追加
						this.addTaskQue(resMove.bs, this.getMovable(ep, resMove.ope.substr(-1)), task[ROOT] + resMove.ope, task[DEPTH]++);
					}
					//問題を縮小できる場合は縮小した問題を解く
					if (this.wi > 2 && this.hi > 2 && (newProb = this.getReducedProb(resMove.bs))) {
console.log('Reduced!');
//console.log(newProb);
						//枝刈り
						this.pruning(1, { passRate: 0.3 });
						this.boardHash = {};
						this.goalAreaHash = this.getLoadToGoal(this.reversSteps);
						this.subSP = new SlidePuzzle;
//window.sp = this.subSP;
						var root = this.subSP.solve(newProb);
						//縮小した問題でゴールできた場合
						if (root) {
							return '' + task[ROOT] + resMove.ope + root;
						}
//						delete this.subSP;
						r_cnt++;
					}
					//枝刈り
					this.pruning(1, { passRate: 0.7, minPassCnt: 5000 });
				}
			}
//if(cnt%500==0){
//console.log(cnt+':'+this.taskQue.length);
//return;
//}

		}
//console.log(this.taskQue);
//console.log(this.boardHash);
//		return 'missing goal...';
		return '';
	},

	/**
	* 一手実行
	*/
	takeATrun: function(bs, ope, end_bs, origin_bs){
		var resMove = this.move(bs, ope);
		var nextOpe = {};
		if (resMove.bs == origin_bs) {
			resMove = { bs: bs, ope: ope, final: true }
		} else if ((resMove.bs == this.goal || resMove.bs == end_bs) || (this.goalAreaHash && this.goalAreaHash[resMove.bs])) {
			resMove.final = true;
		} else {
			//次の手が一通りしかない場合は続けてもう一手すすめる
			nextOpe = this.getMovable(this.getEmpPos(resMove.bs), ope);
			if (nextOpe.length==1) {
				resMove = this.takeATrun(resMove.bs, nextOpe, end_bs, origin_bs);
				resMove.ope = ope + resMove.ope;
			}
		}
		return resMove;
	},

	/**
	* 0を指定された方向へ動かす
	*/
	move: function(bs, dir){
		this.boardHash[bs] = 1;

		var addPos, reverseDir, empPos, toPos, boardAry,
			res_bs, res_ope, resMove;
		switch (dir) {
		case 'U':
			addPos = -this.wi;
			break;
		case 'D':
			addPos = this.wi;
			break;
		case 'L':
			addPos = -1;
			break;
		case 'R':
			addPos = 1;
			break;
		}
		reverseDir = this.getReverseDir(dir);
		empPos = this.getEmpPos(bs);
		toPos = empPos + addPos;
		boardAry = bs.split('');
		this.changeIdx(boardAry, empPos, toPos);
		res_bs = boardAry.join('');
		res_ope = dir;

		return { bs: res_bs, ope: res_ope };
	},

	/**
	* そのフィールドで可能な操作を取得
	*/
	getMovable: function(pos, befDir){
		//ただし一手前の逆操作は除く
		var exceptDir = this.getReverseDir(befDir);
		return this.fields[pos].dset.replace(exceptDir, '');
	},

	/**
	* 指定された操作の逆操作を取得
	*/
	getReverseDir: function(dir){
		var reverseDir = '';
		switch (dir) {
		case 'U':
			reverseDir = 'D';
			break;
		case 'D':
			reverseDir = 'U';
			break;
		case 'L':
			reverseDir = 'R';
			break;
		case 'R':
			reverseDir = 'L';
			break;
		}
		return reverseDir;
	},

	/**
	* 0の現在地を取得
	*/
	getEmpPos: function(bs){
		return bs.search(this.EMP);
	},

	/**
	* 終着点の状態を取得
	*/
	getGoal: function(bs){
		var goal = bs.replace(/(=|0)/gi, '').split('').sort().join('');
		for (var i=0, j=0, len=bs.length; i<len; i++) {
			if (bs.substr(i,1)=='=') {
				goal = goal.substr(0, i+j) + '=' + goal.substr(i+j);
				j++;
			}
		}
		return goal + '0';
	},

	/**
	* 重み付け
	*/
	getWeight: function(){
		var weight;
		switch(this.wi){
		case 2:
			weight = [1,1, 1,1, 1,1, 1,1, 1,1, 1,1];
			break;
		case 3:
			weight = [500,10,10, 10,1,1, 10,1,1, 10,1,1, 10,1,1, 10,1,1];
			break;
		case 4:
			weight = [500,10,10,10, 10,1,1,1, 10,1,1,1, 10,1,1,1, 10,1,1,1, 10,1,1,1];
			break;
		case 5:
			weight = [500,10,10,10,10, 10,1,1,1,1, 10,1,1,1,1, 10,1,1,1,1, 10,1,1,1,1, 10,1,1,1,1];
			break;
		case 6:
			weight = [500,10,10,10,10,10, 10,1,1,1,1,1, 10,1,1,1,1,1, 10,1,1,1,1,1, 10,1,1,1,1,1, 10,1,1,1,1,1];
			break;
		}
		return weight;
	},

	/**
	* 縮小した問題を取得
	*/
	getReducedProb: function(bs){
		var w = this.wi,
			h = this.hi,
			goal = this.goal,
			remain = bs;
		var i, reduce, remainCand;
		//縦縮小
		reduce = 0;
		for (var i=0, len=h-2; i<len; i++) {
			if (goal.substr(w * i, w) != remain.substr(w * i, w)) {
				break;
			}
			reduce++;
		}
		if (reduce) {
			//残りの盤面でパネルを循環できる場合
//TODO:循環できるかどうかの判定
			remainCand = remain.substr(w * (reduce-1) + w);
			if (reduce > 0 && !remainCand.match(/=/)) {
				remain = remainCand;
				h = h - reduce;
				goal = goal.substr(w * (reduce-1) + w);
			}
		}

		//横縮小
		reduce = 0, remainCand = '';
		for (var i=0, len=w-2; i<len; i++) {
			for (var j=0; j<h; j++) {
				if (goal.charAt(w * j + i) != remain.charAt(w * j + i)) {
					break;
				}
			}
			if (j!=h) { break; }
			reduce++;
		}
		if (reduce) {
			for (var j=0; j<h; j++) {
				remainCand += remain.substr(w * j + reduce, w - reduce);
			}
			//残りの盤面でパネルを循環できる場合
			if (remainCand != remain && !remainCand.match(/=/)) {
				remain = remainCand;
				w = w - reduce;
			}
		}

		return (bs==remain) ? null : { bi: remain, wi: w, hi: h };
	},

	/**
	* 探索待ちキューに追加
	*/
	addTaskQue: function(bs, ope, root, depth){
		this.taskQue.push([bs, ope, root, depth]);
	},

	/**
	* 枝刈り
	*/
	pruning: function(pattern, opt){
		var opt = opt || {};
		switch(pattern){
		case 1:
			var passRate = opt.passRate || 1;
			var minPassCnt = opt.minPassCnt || 1000;
			if (this.taskQue.length > minPassCnt) {
				var r = this.rating;
				var sp = this;
				this.taskQue = this.taskQue.sort(function(a, b){
					return r.apply(sp, [a]) < r.apply(sp, [b]);
				}).slice(0, this.taskQue.length * passRate);
			}
			break;
		}
	},

	/**
	* 枝刈り用レーティング
	*/
	rating: function(task){
		var BOARD_STATE = 0;
		var rate = 0,
			bs = task[BOARD_STATE],
			goal = this.goal,
			score = this.score || (this.score = this.getWeight());
		for (var i=0, len=bs.length; i<len; i++) {
			if (bs.substr(i,1) == goal.substr(i,1)) {
				rate += score[i];
			}
		}
		return rate;
	},

	/**
	* 配列の要素同士を入れ替える
	*/
	changeIdx: function(array, i, j){
		var tmp = array[i];
		array[i] = array[j];
		array[j] = tmp;
	}
});
