(function (GlueStick, GlueStack) {
    'use strict';

    const searchBox = new GlueStick({
        subject: '.search-box',
        zIndex: 2000
    });

    new GlueStack({
        seniorSticky: searchBox,
        mainContainer: document.querySelector('.main-container'),
        hierarchySelectors: ['h1', 'h2', 'h3'],
        zIndex: 1000
    });

}(GlueStick, GlueStack));
