(function() {
	
	var audioResume = function(){
        if (WebAudio._context.state === "suspended") WebAudio._context.resume();
    };
    this.document.addEventListener("click", audioResume);
    this.document.addEventListener("touchend", audioResume);
    this.document.addEventListener("keydown", audioResume);
	   
	//開発情報
	Scene_Title.prototype.version = function() {
		var version = new Sprite();
		this.addChild(version);
		version.bitmap = new Bitmap(300, 100);
		version.bitmap.drawText("Ver 1.1 Created by エリック", 0, 0, version.width, version.height, "left");
		version.x = 500;
		version.y = 530;
	}
	
	//常時ダッシュ
	Game_Player.prototype.isDashing = function() {
		if ($gameSwitches.value(8)) return true;
		return this._dashing;
	};
	
	//通行可能設定
	Game_Map.prototype.isPassable = function(x, y, d) {
		if (this.checkPassage(x, y, (1 << (d / 2 - 1)) & 0x0f) || !this.regionId(x, y) == 1 || this.regionId(x, y) == 2 || this.regionId(x, y) == 3　|| !this.regionId(x, y) == 4) {
			return true;
		}else if(this.regionId(x, y) == 4){
			return this.checkPassage(x, y, (1 << (d / 2 - 1)) & 0x0f);
		}
	};
	
	//タイトル画面
	Window_TitleCommand.prototype.updatePlacement = function() {
		this.x = (Graphics.boxWidth - this.width) / 2 + 200;
		this.y = Graphics.boxHeight - this.height - 96;
	};
	Window_TitleCommand.prototype.windowWidth = function() {
		return 300;
	};
	Window_TitleCommand.prototype.makeCommandList = function() {
		this.addCommand("　ゲーム開始",   'newGame');
		var info = DataManager.loadSavefileInfo(1);
		if (info) {
			if (info["omake"]) this.addCommand("　おまけ画像",   'omake');
		}
		this.addCommand("　 設　定",   'options');
	};
	Scene_Title.prototype.createCommandWindow = function() {
		this._commandWindow = new Window_TitleCommand();
		this._commandWindow.setHandler('newGame',  this.commandNewGame.bind(this));
		this._commandWindow.setHandler('omake',  this.commandOmake.bind(this));
		this._commandWindow.setHandler('continue', this.commandContinue.bind(this));
		this._commandWindow.setHandler('options',  this.commandOptions.bind(this));
		this.addWindow(this._commandWindow);
	};
	Scene_Title.prototype.commandOmake = function() {
		DataManager.setupNewGame();
		this._commandWindow.close();
		this.fadeOutAll();
		$gameSystem.omake = true;
		SceneManager.goto(Scene_Map);
	};
	
	
	Window_TitleCommand.prototype.standardPadding = function() {
		return 16;
	};
	Window_TitleCommand.prototype.standardBackOpacity = function() {
		return 0;
	};
	Window_TitleCommand.prototype.standardFontSize = function() {
		return 40;
	};
	Window_TitleCommand.prototype.lineHeight = function() {
		return 72;
	};
	
	//攻撃
	Input.keyMapper[32] = 'shoot';
	var _Scene_Map_updateScene = Scene_Map.prototype.updateScene;
    Scene_Map.prototype.updateScene = function() {
        _Scene_Map_updateScene.call(this);
		if (Input.isPressed('shoot') && $gameSwitches.value(1) && !$gameSwitches.value(14)) $gameSwitches.setValue(2,true);
	};
	attackEvents = function(event) {
		attackReact();
		var bx = Math.floor($gameMap._events[event]._realX);
		var by = Math.floor($gameMap._events[event]._realY);
		Scene_Map.prototype.createBlood(bx, by)
		if ($gameSystem.hp[event] == 100) {
			$gameVariables._data[2]++;
		}
		$gameMap._events[event].requestAnimation(2);
		var rand = Math.floor( Math.random() * 21 ) + 100;
		AudioManager.playSe({"name":"Slash10","volume":50,"pitch":rand,"pan":0});
		rand = Math.floor( Math.random() * 81 ) + 20;
		$gameSystem.hp[event] -= rand;
		if ($gameSystem.hp[event] <= 0) {
			var name = $gameMap._events[event]._characterName;
			if (name == "fs01" || name == "fs02") {
				AudioManager.playSe({"name":"Cry1","volume":50,"pitch":120,"pan":0});
			}else{
				AudioManager.playSe({"name":"Cry2","volume":50,"pitch":120,"pan":0});
			}
			var key_b = [$gameMap._mapId, event, "B"];
			$gameSelfSwitches.setValue(key_b, true);
			$gameVariables._data[1]++;
			$gameVariables._data[2]--;
		}
	}
	
	//攻撃反応
	attackReact = function() {
		for (var i = 1; i <= $gameMap._events.length; i++){
			if ($gameMap._events[i]) {
				if ($gameSystem.hp[$gameMap._events[i]._eventId] == 100){
					var temp = $gamePlayer.x - $gameMap._events[i].x;
					if (Math.abs(temp) < 8) {
						var key_a = [$gameMap._mapId, $gameMap._events[i]._eventId, "A"];
						if ($gameSelfSwitches.value(key_a) !== true) {
							$gameMap._events[i].requestBalloon(11);
							// if (!$gameSwitches.value(13) && $gameMap._events[i]._characterName != "ms01") {
								// var rand = Math.floor( Math.random() * 21 ) + 130;
								// $gameSwitches.setValue(13,true)
								// AudioManager.playSe({"name":"Scream","volume":20,"pitch":rand,"pan":0});
							// }
						}
						$gameSelfSwitches.setValue(key_a, true);
					}
				}
			}
		}
		$gameSwitches.setValue(13,false);
	}
		
	// 歩行音
	var GPI = Game_Player.prototype.initMembers;
	Game_Player.prototype.initMembers = function() {
		GPI.call(this);
		this._walkSE = 0;
	};
	Game_Player.prototype.moveStraight = function(d) {
		if (this.canPass(this.x, this.y, d)) {
			this._followers.updateMove();
			if ($gameSwitches.value(1)) $gameSwitches.setValue(3,true);
		}
		Game_Character.prototype.moveStraight.call(this, d);
	};
	Game_Player.prototype.moveDiagonally = function(horz, vert) {
		if (this.canPassDiagonally(this.x, this.y, horz, vert)) {
			this._followers.updateMove();
			$gameSwitches.setValue(3,true);
		}
		Game_Character.prototype.moveDiagonally.call(this, horz, vert);
	};
	
	//斜め移動
	Game_Player.prototype.getInputDirection = function() {
		return Input.dir8;
	};
	Game_Player.prototype.executeMove = function(direction) {
		switch (direction) {
			case 1: this.moveDiagonally(4, 2); break;
			case 3: this.moveDiagonally(6, 2); break;
			case 7: this.moveDiagonally(4, 8); break;
			case 9: this.moveDiagonally(6, 8); break;
			default: this.moveStraight(direction);
		}
	};
	
	//情報ウィンドウ
	var Scene_map_start = Scene_Map.prototype.start;
	Scene_Map.prototype.start = function() {
		Scene_map_start.call(this);
	    this._InfoWindow = new Window_Info();
	    this.addWindow(this._InfoWindow);
	};
    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        this._InfoWindow.setText();
		if ($gameSwitches.value(1)) this.createGauge();
		if (this._KillCount) this._KillCount.refresh();
    };
	function Window_Info() {
	    this.initialize.apply(this, arguments);
	}
	Window_Info.prototype = Object.create(Window_Base.prototype);
	Window_Info.prototype.constructor = Window_Info;
	Window_Info.prototype.initialize = function() {
		var x = 325;
		var y = -10;
	    var width = 500;
	    var height = 75;
	    Window_Base.prototype.initialize.call(this, x, y, width, height);
		this.opacity = 0;
	};
	Window_Info.prototype.setText = function(str) {
		this._text = str;
		this.refresh();
	};
	Window_Info.prototype.refresh = function() {
	    this.contents.clear();
		if ($gameSwitches.value(1)) {
			this.drawText(" 死者  " + $gameVariables._data[1] + " 人", 0, 0);
			this.drawText("負傷者 " + $gameVariables._data[2] + " 人", 200, 0);
		}
	};
	
    //ゲージ表示
	var GCB = Game_CharacterBase.prototype.update;
	Game_CharacterBase.prototype.update = function() {
		GCB.call(this);
	};
	Game_CharacterBase.prototype.updateGauge = function() {
		if ($gameSwitches.value(1)) {
			if (this._gauge && this.isNearTheScreen()) {
				this._gauge.x = (($gamePlayer.scrolledX()- $gamePlayer._realX + this._realX) * 48) - 2;
				this._gauge.y = (($gamePlayer.scrolledY()- $gamePlayer._realY + this._realY) * 48) - 20;
				this._gauge.hp = this._eventId ? $gameSystem.hp[this._eventId] : 0;
				this._gauge.refresh();
			}
		}else if (this._gauge) {
			SceneManager._scene.removeChild(this._gauge);
			this._gauge = null;
		}
	};
	Scene_Map.prototype.createGauge = function(){
		for (var i = 1; i <= $gameMap._events.length; i++){
			if ($gameMap._events[i]) {
				if (!$gameMap._events[i]._gauge && $gameSystem.hp[i]) {
					$gameMap._events[i]._gauge = new Window_Gauge();
					$gameMap._events[i]._gauge.id = i;
					this.addWindow($gameMap._events[i]._gauge);
				}
			}
		}
		if (!$gamePlayer._gauge) {
			$gamePlayer._gauge = new Window_Gauge();
			$gamePlayer._gauge.id = 0;
			this.addWindow($gamePlayer._gauge);
		}
	}
	function Window_Gauge() {
	    this.initialize.apply(this, arguments);
	}
	Window_Gauge.prototype = Object.create(Window_Base.prototype);
	Window_Gauge.prototype.constructor = Window_Gauge;
	Window_Gauge.prototype.initialize = function() {
	    var width = 50;
	    var height = 20;
	    Window_Base.prototype.initialize.call(this, 0, 0, width, height);
		this.opacity = 0;
		this.id = 0;
		this.hp = 0;
	};
	Window_Gauge.prototype.standardPadding = function() {
		return 0;
	};
	Window_Gauge.prototype.refresh = function() {
	    this.contents.clear();
		if (this.id == 0) {
			this.drawGauge(0, -20, this.width, $gameVariables._data[5] / 100, this.tpGaugeColor1(), this.tpGaugeColor2());
		}else if ($gameSystem.hp[this.id] > 0) {
			this.drawGauge(0, -20, this.width, $gameSystem.hp[this.id] / 100, this.hpGaugeColor1(), this.hpGaugeColor2());
		}
	};
	
	var SCU = Sprite_Character.prototype.update;
	Sprite_Character.prototype.update = function() {
		SCU.call(this);
		this._character.updateGauge();
	};
	
	//スタミナ設定
	Game_Player.prototype.updateDashing = function() {
        if (this.isMoving()) {
            return;
        }
        if (this.canMove() && !this.isInVehicle() && !$gameMap.isDashDisabled() && $gameVariables._data[5] > 0) {
            this._dashing = this.isDashButtonPressed() || $gameTemp.isDestinationValid();
        } else {
            this._dashing = false;
        }
    };
	
	//殺害数文字表示
	Scene_Map.prototype.killCount = function(){
		var sprite = new Sprite();
		SceneManager._scene.addChild(sprite);
		sprite.bitmap = new Bitmap(100, 100);
		sprite.x = 365;
		sprite.y = 245;
		sprite.bitmap.outlineColor = "#FF0000";
		sprite.bitmap.textColor = "#000000";
		sprite.bitmap.outlineWidth = 5;
		sprite.bitmap.fontSize = 60;
		sprite.bitmap.drawText($gameVariables._data[1], 0, 0, sprite.width, sprite.height, "right");
	}
	
	function Window_KillCount() {
	    this.initialize.apply(this, arguments);
	}
	Window_KillCount.prototype = Object.create(Window_Base.prototype);
	Window_KillCount.prototype.constructor = Window_KillCount;
	Window_KillCount.prototype.initialize = function() {
	    var width = 150;
	    var height = 100;
	    Window_Base.prototype.initialize.call(this, 380, 250, width, height);
		this.opacity = 0;
		this.contents.outlineColor = "#FF0000";
		this.contents.textColor = "#000000";
		this.contents.outlineWidth = 5;
		this.contents.fontSize = 60;
	};
	Window_KillCount.prototype.refresh = function() {
	    this.contents.clear();
		this.drawText($gameVariables._data[9], 20, 10, 100, this.height, 'right');
	};
	
	Scene_Map.prototype.makeKillCount = function(){
		SceneManager._scene._KillCount = new Window_KillCount();
		SceneManager._scene.addChild(SceneManager._scene._KillCount);
	}
	
	Scene_Map.prototype.makeKillRecord = function(){
		var info = DataManager.loadSavefileInfo(1);
		var record = new Sprite();
		SceneManager._scene.addChild(record);
		record.bitmap = new Bitmap(500, 100);
		var best = info["best"];
		var total = info["total"];
		record.bitmap.drawText("最高記録　" + best + "　人　" + "殺害合計　" + total + "　人", 0, 0, record.width, record.height, "left");
		record.x = 10;
		record.y = 530;
	}
	
	//セーブ情報追加
	DataManager.makeSavefileInfo = function() {
		var info = {};
		info.best = $gameSystem.best;
		info.total = $gameSystem.total;
		info.omake = $gameSystem.omake;
		info.globalId   = this._globalId;
		info.title      = $dataSystem.gameTitle;
		info.characters = $gameParty.charactersForSavefile();
		info.faces      = $gameParty.facesForSavefile();
		info.playtime   = $gameSystem.playtimeText();
		info.timestamp  = Date.now();
		return info;
	};
	
	var STC = Scene_Title.prototype.create;
	Scene_Title.prototype.create = function() {
		STC.call(this);
		this.version();
	};
	
	//出血スプライトの生成。
	Scene_Map.prototype.createBlood = function(x, y) {
		var blood = new Sprite_Blood(x, y);
        SceneManager._scene._spriteset._tilemap.addChild(blood);
	};
	//出血スプライトの定義。
	function Sprite_Blood() {
		this.initialize.apply(this, arguments);
	}
	Sprite_Blood.prototype = Object.create(Sprite.prototype);
	Sprite_Blood.prototype.constructor = Sprite_Blood;
	Sprite_Blood.prototype.initialize = function(x, y) {
		Sprite.prototype.initialize.call(this);
		var rand = Math.floor(Math.random() * 4);
		this.bitmap = ImageManager.loadSystem("blood0" + (rand + 1));
		this._animationSprites = [];
		this._effectTarget = this;
		this._hiding = false;
		this._x = x;
		this.x = x;
		this._y = y;
		this.y = y;
		this.z = 0;
	};
	Sprite_Blood.prototype.update = function() {
		Sprite.prototype.update.call(this);
		this.x = (($gamePlayer.scrolledX()- $gamePlayer._realX + this._x) * 48);
		this.y = (($gamePlayer.scrolledY()- $gamePlayer._realY + this._y) * 48);
		this.updateAnimationSprites();
	};
	Sprite_Blood.prototype.updateAnimationSprites = function() {
		if (this._animationSprites.length > 0) {
			var sprites = this._animationSprites.clone();
			this._animationSprites = [];
			for (var i = 0; i < sprites.length; i++) {
				var sprite = sprites[i];
				if (sprite.isPlaying()) {
					this._animationSprites.push(sprite);
				} else {
					this.parent.removeChild(this.sprite);
					SceneManager._scene._spriteset._tilemap.removeChild(this);
				}
			}
		}
	};
	Sprite_Blood.prototype.startAnimation = function(animation, mirror, delay) {
		this.sprite = new Sprite_Animation();
		this.sprite.setup(this._effectTarget, animation, mirror, delay);
		this.parent.addChild(this.sprite);
		this._animationSprites.push(this.sprite);
	};
	Window_Options.prototype.addGeneralOptions = function() {
	};
	
})();