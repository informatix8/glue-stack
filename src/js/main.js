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
     */
    constructor(options) {
        if (options === undefined) {
            options = {};
        }

        const defaults = {};

        defaults.hierarchySelectors = [];
        defaults.mainContainer = document.body;

        merge(this, defaults, options);

        this.hierarchy = this.hierarchySelectors.map((selector, idx) => ({
            level: idx,
            selector: selector,
            glueStick: null,
            lastAboveViewPort: null,
            topSum: 0
        }));

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
            window.addEventListener('scroll', () => {
                this.calculateTops();
            });
            this.calculateTops();
        };

        if (document.readyState === 'complete') {
            start();
        } else {
            window.addEventListener('load', () => { // DO NOT INITIATE BEFORE window.onload !!!
                start();
            });
        }
    }

    /**
     * @method destroy
     * @memberOf GlueStack
     * @instance
     * @summary Destroy stack behavior
     * @public
     */
    destroy() {
        this.destroyed = true;
    }

    /**
     * @method cleanHierarchy
     * @memberOf GlueStack
     * @instance
     * @summary Cleans hierarchy before calculation
     * @private
     */
    cleanHierarchy() {
        this.hierarchy.forEach(obj => {
            obj.lastAboveViewPort = null;
            obj.topSum = 0;
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
        this.hierarchy.forEach(obj => {
            const seniors = this.hierarchy.filter(obj2 => obj2.level <= obj.level);
            const hierarchySelectorsQuery = seniors.map(obj => obj.selector).join(',');

            let nextHierarchyElement;
            if (obj.lastAboveViewPort) {

                let nextElementSibling = obj.lastAboveViewPort.nextElementSibling;
                while (nextElementSibling) {
                    if (nextElementSibling.matches(hierarchySelectorsQuery)) {
                        nextHierarchyElement = nextElementSibling;
                        break;
                    }
                    nextElementSibling = nextElementSibling.nextElementSibling;
                }
            }

            if (nextHierarchyElement) {
                const bottom = obj.topSum + obj.lastAboveViewPort.offsetHeight;
                const nextTopFromViewport = nextHierarchyElement.getBoundingClientRect().top;

                if (nextTopFromViewport <= bottom) {
                    obj.topSum -= (bottom - nextTopFromViewport);
                }
            }
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

        this.cleanHierarchy();

        let sumOfHeights = 0;
        for (let chNo = 0; chNo < this.mainContainer.children.length; chNo++) {
            const node = this.mainContainer.children[chNo];
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

                if (node.absoluteTop - scrollY <= topSum) {
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

        this.hierarchy.forEach(obj => {
            if (!obj.lastAboveViewPort) {
                if (obj.glueStick) {
                    obj.glueStick.destroy();
                    obj.glueStick = null;
                }
                return;
            }

            if (obj.glueStick) {
                // const glueStickTop = parseInt(obj.glueStick.subject.style.top);
                const glueStickTop = obj.glueStick.top;

                const changed = obj.glueStick.subject !== obj.lastAboveViewPort || glueStickTop !== obj.topSum;
                if (!changed) {
                    return;
                }
                obj.glueStick.destroy();
            }

            let zIndex;
            if (this.zIndex) {
                zIndex = this.zIndex + this.hierarchy.length - 1 - obj.level;
            }

            obj.glueStick = new GlueStick({
                subject: obj.lastAboveViewPort,
                stopStickingMaxWidth: 200,
                top: obj.topSum,
                zIndex: zIndex,
                positionCalculations: [
                    function () {
                        const opts = {
                            top: this.top
                        };
                        if (this.prevOpts && this.prevOpts.top === opts.top && this.prevOpts.disable === opts.disable) {
                            return;
                        }
                        this.prevOpts = Object.assign({}, opts);
                        this.glued.update(opts);
                    }
                ]
            });
        });
    }
}

export default GlueStack;
