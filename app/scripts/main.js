(function (_, $) {
	'use strict';
	var hs = window.hearthstone || {},
	cardLibrary = [],
	BASE_CARD_URL = 'images/cards/',
	HEARTHPWN_CARD_URL = 'http://www.hearthpwn.com/cards/',
	RARITY_LIST = [
		'legendary',
		'epic',
		'rare',
		'common',
		'free'
	],
	cardbacks = {
		CLASSIC: 'classic-cardback.png',
		LEGEND: 'cardback-legendrank.png',
		WARLORDS: 'warlords-cardback.png',
		GOLDEN: 'golden-cardback.png',
		NINJA: 'ninja-cardback.png',
		NEFARIAN: 'cardback-brm-heroic.png',
		BLACKROCK_PREORDER: 'cardback-brm-preorder.png',
		FIRESIDE: 'fireside-cardback.png',
		TESPA: 'tespa-cardback.png'
	},
	DEFAULT_RARITY = 'free',
	DEFAULT_CARDBACK = cardbacks.CLASSIC,
	hearthpwnIds = [
		{
			id: "NEW1_030",
			hearthpwnId: 474,
			name: 'Deathwing'
		},
		{
			id: "GVG_041",
			hearthpwnId: 12298,
			name: 'Dark Wispers'
		},
		{
			id: "GVG_053",
			hearthpwnId: 12215,
			name: 'Shieldmaiden'
		},
		{
			id: "EX1_621",
			hearthpwnId: 38,
			name: 'Circle of Healing'
		},
		{
			id: "CS2_023",
			hearthpwnId: 489,
			name: 'Arcane Intellect'
		}
	],
	highlightCards = function (options) {
		var defaultOptions = {
			hearthpwnLink: true,
			useGolden: false
		},
		useGolden = function (card, goldConfig) {
			var goldMode = false;
			if (_.isArray(goldConfig) && goldConfig.length > 0 
				&& goldConfig.indexOf(card.rarity.toLowerCase()) !== -1) {
					goldMode = true;
			} else if (goldConfig === true) {
				goldMode = true;
			}
			return goldMode;
		};
		options = _.merge(defaultOptions, options);
		$('a[hearthstone-card]').each(function () {
			var matchedCard = getCardByName($(this).text());
			console.log(matchedCard);
			// Check for valid rarity
			if (RARITY_LIST.indexOf(matchedCard.rarity.toLowerCase()) === -1) {
				matchedCard.rarity = DEFAULT_RARITY;
			}
			$(this).addClass(matchedCard.rarity.toLowerCase() + '-rarity');
			if (options.hearthpwnLink) {
				$(this).attr({
					target: '_blank',
					href: HEARTHPWN_CARD_URL + matchedCard.hearthpwnId
				});
			}
			$(this).data('hs-golden', useGolden(matchedCard, options.useGolden));
		});
	},
	getCardByID = function (cardId) {
		var match = _.findWhere(cardLibrary, {id: cardId});
		if (match) {
			var hpMatch = getHearthpwnID(match);
			if (hpMatch) {
				match.hearthpwnId = hpMatch.hearthpwnId;
			}
		}
		return match;
	},
	getHearthpwnID = function (card) {
		return _.findWhere(hearthpwnIds, {id: card.id});
	},
	getCardByName = function (cardName) {
		var match = _.find(cardLibrary, function (card) {
			return card.name.toUpperCase() === cardName.toUpperCase();
		});
		if (match) {
			var hpMatch = getHearthpwnID(match);
			if (hpMatch) {
				match.hearthpwnId = hpMatch.hearthpwnId;
			}
		}
		return match;
	},
	updateTooltip = function (card, goldMode, cardFrame) {
		var cardImage = false,
				GOLD_VIDEO = true,
				cardFrame = cardFrame || '#card-hover',
				tooltip = $(cardFrame);
		if (GOLD_VIDEO && goldMode) {
			var cardPlayer = tooltip.find('.hs-card-video').get(0);
			cardPlayer.pause();
			tooltip.find('.hs-card-webm').attr({
				src: BASE_CARD_URL + 'legendary/' + card.hearthpwnId + '.webm'
			});
			cardPlayer.load();
			cardPlayer.play();
			tooltip.find('video').show();
			tooltip.find('img.card-image').hide();
		} else {
			if (goldMode) {
				cardImage = BASE_CARD_URL + 'legendary/' + card.hearthpwnId + '.png';
			} else {
				cardImage = BASE_CARD_URL + card.hearthpwnId + '.png';
			}
			tooltip.find('video').hide();
			tooltip.find('img.card-image').attr('src', cardImage).show();
		}
	},
	getParameterByName = function (name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	},
	URLToArray = function (url) {
	  var request = {};
	  var pairs = url.substring(url.indexOf('?') + 1).split('&');
	  for (var i = 0; i < pairs.length; i++) {
	    var pair = pairs[i].split('=');
	    request[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
	  }
	  return request;
	};

	/**
	 * @name hearthstone.prepEmbed
	 * @description Used with embed. Updates card shown based on URL params
	 */
	hs.prepEmbed = function () {
		var matchedCard,
				options = URLToArray(location.search),
				golden = (options.golden === "true" || options.golden === true),
				cardFrame = $('#card-frame');
		// Load the master card library JSON
		this.loadCards().then(function () {
			if (options.card) {
				matchedCard = getCardByID(options.card);
			} else if (options.name) {
				matchedCard = getCardByName(options.name);
			}
			// Do we have a match?
			if (matchedCard) {
				updateTooltip(matchedCard, golden, '#card-frame');
			}
			if (options.cardback) {
				var cardback = cardbacks[options.cardback.toUpperCase()];
				$('.card-back-image').attr({
					src: BASE_CARD_URL + 'cardbacks/' + cardback
				});				
			}
			if (options.flipped === 'true' || options.flipped === true) {
				$('#card-frame').addClass('flip');
			}
			$('#card-frame').on('touchstart click', function () {
				$(this).toggleClass('flip');
			});
		});
	};

	/**
	 * @name hearthstone.init
	 * @description Scans page for hearthstone cards and updates their links
	 */
	hs.init = function () {
		// Load the master card library JSON
		this.loadCards().then(function () {
			highlightCards({
				useGolden: ['legendary']
			});
			$('a[hearthstone-card]').on('mouseover', function (e) {
				var matchedCard = getCardByName($(this).text());
				if (matchedCard) {
					updateTooltip(matchedCard, $(this).data('hs-golden'));
					$('#card-hover').show();
				} else {
					// No match found
				}
			}).on('mouseout', function (e) {
				$('#card-hover').hide();
			});

			$('body').on('mousemove', function (e) {
				var HOVER_OFFSET = 25;
				$('#card-hover').css({
					top: e.pageY + HOVER_OFFSET,
					left: e.pageX - HOVER_OFFSET
				});
			});
		});
	};

	/**
	 * @name hearthstone.loadCards
	 * @description Load card set data needed for everything else. Needs to be first
	 * @return {Promise} Once promise resolves, you can make magic happen
	 */
	hs.loadCards = function () {
		// Load card set data
		return $.get('/data/cards.json').then(function (cardSets) {
			cardLibrary = [];
			_.forEach(cardSets, function (set) {
				cardLibrary = cardLibrary.concat(set);
			});
		});
	};

	window.hearthstone = hs;
})(_, jQuery);