import GlueStick from '@informatix8/glue-stick';
import merge from 'lodash.merge';

class GlueStack {

    /**
     @class GlueStack
     @summary Sticks a stack of headers inside the viewport instead of scrolling out of view.
     @param {Object} options - Supplied configuration
     @param {HTMLElement} options.mainContainer - Container which contains the headers as direct children
     @param {String[]|HTMLElement[]} options.hierarchySelectors - Array of selectors for getting headers hierarchy **Required**
     @param {Number} options.zIndex - zIndex of the lowest header element. **Optional**
     @param {GlueStick} options.seniorSticky - Collapsible sticky element which appears while scrolling up. **Optional**
     @param {Number} [options.stopStickingMaxWidth=600] Maximum responsive pixel width where the sticky stops sticking
     @param {Object} options.glueStickOpts - additional params to pass to glueStick instances **Optional**
     @param {Object} [options.callbacks] - User supplied functions to execute at given stages of the component lifecycle
     @param {Function} options.callbacks.preCreate
     @param {Function} options.callbacks.postCreate
     @param {Function} options.callbacks.preDestroy
     @param {Function} options.callbacks.postDestroy
     */
    constructor(options) {
        if (options === undefined) {
            options = {};
        }

        const defaults = {};

        defaults.stopStickingMaxWidth = options.stopStickingMaxWidth || 600;
        defaults.hierarchySelectors = [];
        defaults.mainContainer = document.body;

        defaults.glueStickOpts = {};

        merge(this, defaults, options);

        this.hierarchy = this.hierarchySelectors.map((selector, idx) => ({
            level: idx,
            selector: selector,
            glueStick: null,
            lastAboveViewPort: null,
            topSum: 0
        }));

        this.callCustom('preCreate');

        this.lastScrollY = window.scrollY;
        this.scrollLength = 0;
        if (this.seniorSticky) {
            this.seniorSticky.top = -window.scrollY;
            this.seniorSticky.positionCalculations = [
                function () {
                    const opts = {
                        top: this.top
                    };
                    if (this.prevOpts && this.prevOpts.top === opts.top && this.prevOpts.disable === opts.disable) {
                        return;
                    }
                    merge(this.prevOpts, {}, opts);
                    this.glued.update(opts);
                }
            ];
        }

        const requestAnimFrame = (function () {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                function (callback) {
                    window.setTimeout(callback, 1000 / 60);
                };
        }());

        const animloop = () => {
            if (this.destroyed) {
                return;
            }
            requestAnimFrame(animloop);
            this.calculateTops();
        };

        const start = () => {
            // animloop();

            this.scrollFn = this.onScroll.bind(this);
            window.addEventListener('scroll', this.scrollFn);
            this.calculateTops();
        };

        if (document.readyState === 'complete') {
            start();
        } else {
            this.startFn = start;
            window.addEventListener('load', start); // DO NOT INITIATE BEFORE window.onload !!!
        }

        const destroyFn = this.destroy.bind(this);
        window.addEventListener('unload', destroyFn);

        this.callCustom('postCreate');
    }

    /**
     * @method destroy
     * @memberOf GlueStack
     * @instance
     * @summary Destroy stack behavior
     * @public
     */
    destroy() {
        this.callCustom('preDestroy');
        this.destroyed = true;
        this.hierarchy.forEach(hierarchyMember => {
            if (hierarchyMember.glueStick) {
                hierarchyMember.glueStick.destroy();
                hierarchyMember.glueStick = null;
            }
        });

        if (this.scrollFn) {
            window.removeEventListener('scroll', this.scrollFn);
        }
        if (this.startFn) {
            window.removeEventListener('load', this.startFn);
        }

        this.callCustom('postDestroy');
    }

    /**
     * @method onScroll
     * @memberOf GlueStack
     * @instance
     * @summary Handles scrollDown
     * @private
     */
    onScroll() {
        if (this.seniorSticky) {
            const bbox = this.seniorSticky.subject.getBoundingClientRect();

            const scrollLength = window.scrollY - this.lastScrollY;

            if (scrollLength < 0) { // Scroll up
                if (this.scrollLength > bbox.height) {
                    this.scrollLength = bbox.height;
                }
            } else {
                if (this.scrollLength < 0) {
                    this.scrollLength = 0;
                }
            }

            this.scrollLength += scrollLength;

            this.seniorSticky.top = -this.scrollLength;
            if (this.seniorSticky.top < -bbox.height) {
                this.seniorSticky.top = -bbox.height;
            }
            if (this.seniorSticky.top > 0) {
                this.seniorSticky.top = 0;
            }
        }

        this.lastScrollY = window.scrollY;

        this.calculateTops();
    }

    /**
     * @method cleanHierarchy
     * @memberOf GlueStack
     * @instance
     * @summary Cleans hierarchy before calculation
     * @private
     */
    cleanHierarchy() {
        this.hierarchy.forEach(hierarchyMember => {
            hierarchyMember.lastAboveViewPort = null;
            hierarchyMember.topSum = 0;
        });
    }

    /**
     * @method computeHeight
     * @memberOf GlueStack
     * @static
     * @summary Calculates the height of the node excluding collapsing margins
     * @private
     */
    static computeHeight(node) {
        let computedStyle = getComputedStyle(node);
        let height = node.offsetHeight + parseInt(computedStyle.marginTop) + parseInt(computedStyle.marginBottom);
        if (node.previousElementSibling) { // Fix collapsible margins
            const prevComputedStyle = getComputedStyle(node.previousElementSibling);
            if (prevComputedStyle.marginBottom !== '0') {
                const prevMargin = parseInt(prevComputedStyle.marginBottom);
                const currentMargin = parseInt(computedStyle.marginTop);

                if (prevMargin > currentMargin) {
                    height -= currentMargin;
                } else {
                    height -= prevMargin;
                }
            }
        }
        return height;
    }

    /**
     * @method calculateHierarchyOffsets
     * @memberOf GlueStack
     * @instance
     * @summary Calculate the offset of the header in case the next header in the same level is colliding
     * @private
     */
    calculateHierarchyOffsets(scrollY) {
        let seniorStickyOffset = this.seniorSticky ? this.seniorSticky.subject.getBoundingClientRect().bottom : 0;

        this.hierarchy.forEach(hierarchyMember => {
            const seniors = this.hierarchy.filter(hierarchyMember2 => hierarchyMember2.level <= hierarchyMember.level);
            const hierarchySelectorsQuery = seniors.map(hierarchyMember2 => hierarchyMember2.selector).join(',');

            let nextHierarchyElement;
            if (hierarchyMember.lastAboveViewPort) {

                let nextElementSibling = hierarchyMember.lastAboveViewPort.nextElementSibling;
                while (nextElementSibling) {
                    if (nextElementSibling.matches(hierarchySelectorsQuery)) {
                        nextHierarchyElement = nextElementSibling;
                        break;
                    }
                    nextElementSibling = nextElementSibling.nextElementSibling;
                }
            }

            if (nextHierarchyElement) {
                const bottom = hierarchyMember.topSum + hierarchyMember.lastAboveViewPort.offsetHeight;
                const nextTopFromViewport = nextHierarchyElement.getBoundingClientRect().top;

                if (nextTopFromViewport <= bottom) {
                    hierarchyMember.topSum -= (bottom - nextTopFromViewport);
                }
            }

            hierarchyMember.topSum += seniorStickyOffset;
        });
    }

    /**
     * @method calculateTops
     * @memberOf GlueStack
     * @instance
     * @summary Calculate which elements should be sticky and calculates the top position of each level
     * @private
     */
    calculateTops() {
        const scrollY = window.scrollY;

        let seniorStickyOffset = this.seniorSticky ? this.seniorSticky.subject.getBoundingClientRect().bottom : 0;

        this.cleanHierarchy();

        let sumOfHeights = 0;
        for (let chNo = 0; chNo < this.mainContainer.children.length; chNo++) {
            const node = this.mainContainer.children[chNo];
            // if (node.classList.contains('sticky')) {
            if (node.classList.contains('sticky-spacer')) {
                continue;
            }

            node.absoluteTop = sumOfHeights;

            let level = 0;
            for (; level < this.hierarchy.length; level++) {
                if (node.matches(this.hierarchy[level].selector)) {
                    break;
                }
            }

            if (level < this.hierarchy.length) {

                let topSum = 0;
                for (let i = 0; i < level; i++) {
                    if (this.hierarchy[i].lastAboveViewPort) {
                        topSum += this.hierarchy[i].lastAboveViewPort.offsetHeight;
                    }
                }

                if (node.absoluteTop - scrollY <= topSum + seniorStickyOffset) {
                    this.hierarchy[level].lastAboveViewPort = node;
                    this.hierarchy[level].topSum = topSum;

                    for (let i = level + 1; i < this.hierarchy.length; i++) {
                        this.hierarchy[i].lastAboveViewPort = null;
                    }
                }
            }

            let height = GlueStack.computeHeight(node);
            sumOfHeights += height;
        }

        this.calculateHierarchyOffsets(scrollY);

        this.hierarchy.forEach(hierarchyMember => {
            if (!hierarchyMember.lastAboveViewPort) {
                if (hierarchyMember.glueStick) {
                    hierarchyMember.glueStick.destroy();
                    hierarchyMember.glueStick = null;
                }
                return;
            }

            if (hierarchyMember.glueStick) {
                const glueStickTop = hierarchyMember.glueStick.top;

                const changed = hierarchyMember.glueStick.subject !== hierarchyMember.lastAboveViewPort || glueStickTop !== hierarchyMember.topSum;
                if (!changed) {
                    return;
                }
                hierarchyMember.glueStick.destroy();
            }

            let zIndex;
            if (this.zIndex) {
                zIndex = this.zIndex + this.hierarchy.length - 1 - hierarchyMember.level;
            }

            const glueStickOpts = {};
            merge(glueStickOpts, this.glueStickOpts, {
                subject: hierarchyMember.lastAboveViewPort,
                stopStickingMaxWidth: this.stopStickingMaxWidth,
                top: hierarchyMember.topSum,
                zIndex: zIndex,
                positionCalculations: [
                    function () {
                        const opts = {
                            top: this.top
                        };
                        if (this.prevOpts && this.prevOpts.top === opts.top && this.prevOpts.disable === opts.disable) {
                            return;
                        }
                        merge(this.prevOpts, {}, opts);
                        this.glued.update(opts);
                    }
                ]
            });

            hierarchyMember.glueStick = new GlueStick(glueStickOpts);
        });
    }

    /**
     * @method callCustom
     * @memberOf GlueStick
     * @instance
     * @summary execute an implementation defined callback on a certain action
     * @private
     */
    callCustom(userFn) {
        const sliced = Array.prototype.slice.call(arguments, 1);

        if (this.callbacks !== undefined && this.callbacks[userFn] !== undefined && typeof this.callbacks[userFn] === 'function') {
            this.callbacks[userFn].apply(this, sliced);
        }
    }

}

export default GlueStack;
