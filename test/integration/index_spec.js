describe('index.html', function() {
    it('Scroll 100', function () {
        cy.viewport(1024, 750);
        cy.visit('/index.html');

        cy.scrollTo(0, 100);
        cy.wait(50);

        cy.get('#t1').should(($element) => {
            const bbox = $element[0].getBoundingClientRect();
            expect(bbox.top, 'top').to.equal(0);
        });
    });
});

describe('index.html', function() {
    it('Scroll 370', function () {
        cy.viewport(1024, 750);
        cy.visit('/index.html');

        cy.scrollTo(0, 370);
        cy.wait(50);

        cy.get('#t1').should(($element) => {
            const bbox = $element[0].getBoundingClientRect();
            expect(bbox.top, 'top').to.equal(0);
            expect(bbox.bottom, 'bottom').to.be.within(87, 90);
        });
        cy.get('#t11').should(($element) => {
            const bbox = $element[0].getBoundingClientRect();
            expect(bbox.top, 'top').to.be.within(87, 90);
        });
    });
});

describe('index.html', function() {
    it('Scroll 600', function () {
        cy.viewport(1024, 750);
        cy.visit('/index.html');

        cy.scrollTo(0, 600);
        cy.wait(50);

        cy.get('#t1').should(($element) => {
            const bbox = $element[0].getBoundingClientRect();
            expect(bbox.top, 'top').to.equal(0);
        });
        cy.get('#t11').should(($element) => {
            const bbox = $element[0].getBoundingClientRect();
            expect(bbox.top, 'top').to.equal(52);
        });
        cy.get('#t12').should(($element) => {
            const bbox = $element[0].getBoundingClientRect();
            expect(bbox.top, 'top').to.equal(123);
        });
    });
});

describe('index.html', function() {
    it('Scroll 970', function () {
        cy.viewport(1024, 750);
        cy.visit('/index.html');

        cy.scrollTo(0, 970);
        cy.wait(50);

        cy.get('#t121').should(($element) => {
            const bbox = $element[0].getBoundingClientRect();
            expect(bbox.top, 'top').to.equal(90 + 71);
        });
        cy.get('#t122').should(($element) => {
            const bbox = $element[0].getBoundingClientRect();
            expect(bbox.top, 'top').to.equal(371);
        });
    });
});

describe('index.html', function() {
    it('Scroll 1150', function () {
        cy.viewport(1024, 750);
        cy.visit('/index.html');

        cy.scrollTo(0, 1150);
        cy.wait(50);

        cy.get('#t121').should(($element) => {
            const bbox = $element[0].getBoundingClientRect();
            expect(bbox.top, 'top').to.be.within(120, 135);
        });
        cy.get('#t122').should(($element) => {
            const bbox = $element[0].getBoundingClientRect();
            expect(bbox.top, 'top').to.be.within(190, 195);
        });
    });
});

describe('index.html', function() {
    it('Scroll 2700', function () {
        cy.viewport(1024, 750);
        cy.visit('/index.html');

        cy.scrollTo(0, 2700);
        cy.wait(50);

        cy.get('#t2').should(($element) => {
            const bbox = $element[0].getBoundingClientRect();
            expect(bbox.top, 'top').to.equal(0);
            expect(bbox.bottom, 'bottom').to.be.within(87, 90);
        });
        cy.get('#t21').should(($element) => {
            const bbox = $element[0].getBoundingClientRect();
            expect(bbox.top, 'top').to.be.within(87, 90);
        });
        cy.get('#t22').should(($element) => {
            const bbox = $element[0].getBoundingClientRect();
            expect(bbox.top, 'top').to.be.within(200, 300);
        });
    });
});
