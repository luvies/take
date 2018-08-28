import { expect } from 'chai';
import 'mocha';
import { Namespace } from '../src/namespace';
import { IOptions, Options } from '../src/options';

describe('Namespace', function(this) {
  let opts: IOptions;
  let ns: Namespace;

  function initEach() {
    opts = Options();
    ns = new Namespace(opts);
  }

  describe('#join', function(this) {
    beforeEach(initEach);

    it('should return an empty string when nothing is passed in', function(this) {
      expect(ns.join()).to.be.empty;
    });

    it('should return a single item as-is', function(this) {
      expect(ns.join('target1')).to.be.equal('target1');
      expect(ns.join('target2')).to.be.equal('target2');
      expect(ns.join('target3')).to.be.equal('target3');
    });

    it('should join items that are pure namespace names', function(this) {
      expect(ns.join('target1', 'target2')).to.be.equal('target1:target2');
      expect(ns.join('target1', 'target2', 'target3')).to.be.equal('target1:target2:target3');
      expect(ns.join('target1', 'target2', 'target3', 'target4')).to.be.equal('target1:target2:target3:target4');
    });

    it('should respect leading namespace separator', function(this) {
      expect(ns.join(':target1')).to.be.equal(':target1');
      expect(ns.join(':target1', 'target2')).to.be.equal(':target1:target2');
      expect(ns.join(':target1', 'target2', 'target3')).to.be.equal(':target1:target2:target3');
    })

    it('should strip in-between and trailing namespace separator', function(this) {
      expect(ns.join('target1:', 'target2')).to.be.equal('target1:target2');
      expect(ns.join('target1:', 'target2', 'target3')).to.be.equal('target1:target2:target3');
      expect(ns.join('target1:', ':target2')).to.be.equal('target1:target2');
      expect(ns.join('target1:', ':target2:', ':target3')).to.be.equal('target1:target2:target3');
      expect(ns.join(':target1:', 'target2')).to.be.equal(':target1:target2');
      expect(ns.join(':target1:', ':target2')).to.be.equal(':target1:target2');
      expect(ns.join(':target1:', ':target2:', 'target3')).to.be.equal(':target1:target2:target3');
    });

    it('should respect the configured namespace separator', function(this) {
      opts.namespaceSeparator = '/';
      expect(ns.join('target1', 'target2')).to.be.equal('target1/target2');
      opts.namespaceSeparator = ';';
      expect(ns.join('target1', 'target2')).to.be.equal('target1;target2');
      opts.namespaceSeparator = '|';
      expect(ns.join('target1', 'target2')).to.be.equal('target1|target2');
    })
  });

  describe('#split', function(this) {
    beforeEach(initEach);

    it('should return a single item as-is', function(this) {
      expect(ns.split('target1')).to.be.eql(['target1']);
      expect(ns.split('target2')).to.be.eql(['target2']);
      expect(ns.split('target3')).to.be.eql(['target3']);
    });

    it('should split items properly', function(this) {
      expect(ns.split('target1:target2')).to.be.eql(['target1', 'target2']);
      expect(ns.split('target1:target2:target3')).to.be.eql(['target1', 'target2', 'target3']);
      expect(ns.split('target1:target2:target3:target4')).to.be.eql(['target1', 'target2', 'target3', 'target4']);
    });

    it('should preserve leading namespace separator', function(this) {
      expect(ns.split(':target1')).to.be.eql(['', 'target1']);
      expect(ns.split(':target1:target2')).to.be.eql(['', 'target1', 'target2']);
      expect(ns.split(':target1:target2:target3')).to.be.eql(['', 'target1', 'target2', 'target3']);
    });

    it('should strip trailing namespace operator', function(this) {
      expect(ns.split('target1:')).to.be.eql(['target1']);
      expect(ns.split('target1:target2:')).to.be.eql(['target1', 'target2']);
      expect(ns.split('target1:target2:target3:')).to.be.eql(['target1', 'target2', 'target3']);
    });

    it('should respect the configured namespace separator', function(this) {
      expect(ns.split('target1:target2/target3|target4')).to.be.eql(['target1', 'target2/target3|target4']);
      opts.namespaceSeparator = '/';
      expect(ns.split('target1:target2/target3|target4')).to.be.eql(['target1:target2', 'target3|target4']);
      opts.namespaceSeparator = '|';
      expect(ns.split('target1:target2/target3|target4')).to.be.eql(['target1:target2/target3', 'target4']);
    });
  });

  describe('#extractArgs', function(this) {
    it('should return an argument-less target unchanged and with and empty list', function(this) {
      expect(ns.extractArgs('target1')).to.be.eql(['target1', []]);
      expect(ns.extractArgs('target2')).to.be.eql(['target2', []]);
      expect(ns.extractArgs('target3')).to.be.eql(['target3', []]);
    });

    it('should leave namespace separators intact', function(this) {
      expect(ns.extractArgs('target1:target2')).to.be.eql(['target1:target2', []]);
      expect(ns.extractArgs('target1:target2:target3')).to.be.eql(['target1:target2:target3', []]);
      expect(ns.extractArgs('target1:target2:target3:')).to.be.eql(['target1:target2:target3:', []]);
    });

    it('should return a single empty string for the arguments if given nothing between the brackets', function(this) {
      expect(ns.extractArgs('target1[]')).to.be.eql(['target1', ['']]);
      expect(ns.extractArgs('target1:target2[]')).to.be.eql(['target1:target2', ['']]);
      expect(ns.extractArgs('target1:target2:target3[]')).to.be.eql(['target1:target2:target3', ['']]);
      expect(ns.extractArgs('target1:target2:[]')).to.be.eql(['target1:target2:', ['']]);
      expect(ns.extractArgs('target1:target2:target3:[]')).to.be.eql(['target1:target2:target3:', ['']]);
    });

    it('should extract the arguments from the target', function(this) {
      expect(ns.extractArgs('target1[arg1]')).to.be.eql(['target1', ['arg1']]);
      expect(ns.extractArgs('target2[arg1,arg2]')).to.be.eql(['target2', ['arg1', 'arg2']]);
      expect(ns.extractArgs('target3[arg1,arg2,arg3]')).to.be.eql(['target3', ['arg1', 'arg2', 'arg3']]);
      expect(ns.extractArgs('target4[arg1,arg2,arg3]')).to.be.eql(['target4', ['arg1', 'arg2', 'arg3']]);
      expect(ns.extractArgs('target5[arg1,arg2,arg3]')).to.be.eql(['target5', ['arg1', 'arg2', 'arg3']]);
      expect(ns.extractArgs('target6[arg1,arg2,arg3]')).to.be.eql(['target6', ['arg1', 'arg2', 'arg3']]);
    });

    it('should preserve spaces in arguments', function(this) {
      expect(ns.extractArgs('target1[arg1 ]')).to.be.eql(['target1', ['arg1 ']]);
      expect(ns.extractArgs('target2[ arg1 ]')).to.be.eql(['target2', [' arg1 ']]);
      expect(ns.extractArgs('target3[arg1, arg2]')).to.be.eql(['target3', ['arg1', ' arg2']]);
      expect(ns.extractArgs('target4[arg1,arg2 , arg3]')).to.be.eql(['target4', ['arg1', 'arg2 ', ' arg3']]);
    });

    it('should return undefined on a badly given target', function(this) {
      // the brackets are the only things that are searched for,
      // so excluding them in any capacity is allowed
      expect(ns.extractArgs('target1[')).to.be.undefined;
      expect(ns.extractArgs('target1]')).to.be.undefined;
      expect(ns.extractArgs('target1[][]')).to.be.undefined;
      expect(ns.extractArgs('target1[]]')).to.be.undefined;
      expect(ns.extractArgs('target1[[]')).to.be.undefined;
      expect(ns.extractArgs('target1[   []    ]')).to.be.undefined;
      expect(ns.extractArgs('target1[arg1')).to.be.undefined;
      expect(ns.extractArgs('target1 arg1]')).to.be.undefined;
      expect(ns.extractArgs('target1[    [arg1]   ]')).to.be.undefined;
      expect(ns.extractArgs('target1[ arg1    ]]')).to.be.undefined;
      expect(ns.extractArgs('target1][')).to.be.undefined;
    })
  });
});
