(function (GlueStack) {
    'use strict';

    new GlueStack({
        mainContainer: document.querySelector('.main-container'),
        hierarchySelectors: ['h1', 'h2', 'h3'],
        zIndex: 1000
    });

}(GlueStack));
