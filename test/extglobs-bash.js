'use strict';

require('mocha');
const path = require('path');
const util = require('util');
const argv = require('minimist')(process.argv.slice(2));
const assert = require('assert');
const picomatch = require('..');
const pm = require('./support');
let sep = path.sep;

/**
 * Some of tests were converted from bash 4.3, 4.4, and minimatch unit tests.
 */

describe('extglob', () => {
  beforeEach(() => picomatch.clearCache());
  beforeEach(() => (path.sep = '\\'));
  afterEach(() => (path.sep = sep));

  let offset = 23;
  let fixtures = [
    [['', '', { bash: true }], true],
    [['', '*(0|1|3|5|7|9)', { bash: true }], false],
    [['*(a|b[)', '*(a|b\\[)', { bash: true }], false],
    [['*(a|b[)', '\\*\\(a|b\\[\\)', { bash: true }], false],
    [['***', '\\*\\*\\*', { bash: true }], true],
    [['-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*', { bash: true }], false],
    [['-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*', { bash: true }], true],
    [['-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*', { bash: true }], false],
    [['/dev/udp/129.22.8.102/45', '/dev\\/@(tcp|udp)\\/*\\/*', { bash: true }], false],
    [['/x/y/z', '/x/y/z', { bash: true }], true],
    [['0377', '+([0-7])', { bash: true }], true, 'Should match octal numbers'],
    [['07', '+([0-7])', { bash: true }], true, 'Should match octal numbers'],
    [['09', '+([0-7])', { bash: true }], false, 'Should match octal numbers'],
    [['1', '0|[1-9]*([0-9])', { bash: true }], true, 'Should match valid numbers'],
    [['12', '0|[1-9]*([0-9])', { bash: true }], true, 'Should match valid numbers'],
    [['123abc', '(a+|b)*', { bash: true }], false],
    [['123abc', '(a+|b)+', { bash: true }], false],
    [['123abc', '*?(a)bc', { bash: true }], true],
    [['123abc', 'a(b*(foo|bar))d', { bash: true }], false],
    [['123abc', 'ab*(e|f)', { bash: true }], false],
    [['123abc', 'ab**', { bash: true }], false],
    [['123abc', 'ab**(e|f)', { bash: true }], false],
    [['123abc', 'ab**(e|f)g', { bash: true }], false],
    [['123abc', 'ab***ef', { bash: true }], false],
    [['123abc', 'ab*+(e|f)', { bash: true }], false],
    [['123abc', 'ab*d+(e|f)', { bash: true }], false],
    [['123abc', 'ab?*(e|f)', { bash: true }], false],
    [['12abc', '0|[1-9]*([0-9])', { bash: true }], false, 'Should match valid numbers'],
    [['137577991', '*(0|1|3|5|7|9)', { bash: true }], true],
    [['2468', '*(0|1|3|5|7|9)', { bash: true }], false],
    [['?a?b', '\\??\\?b', { bash: true }], true],
    [['\\a\\b\\c', 'abc', { bash: true }], false],
    [['a', '!(*.a|*.b|*.c)', { bash: true }], true],
    [['a', '!(a)', { bash: true }], false],
    [['a', '!(a)*', { bash: true }], false],
    [['a', '(a)', { bash: true }], true],
    [['a', '(b)', { bash: true }], false],
    [['a', '*(a)', { bash: true }], true],
    [['a', '+(a)', { bash: true }], true],
    [['a', '?', { bash: true }], true],
    [['a', '?(a|b)', { bash: true }], true],
    [['a', '??', { bash: true }], false],
    [['a', 'a!(b)*', { bash: true }], true],
    [['a', 'a?(a|b)', { bash: true }], true],
    [['a', 'a?(x)', { bash: true }], true],
    [['a', 'a??b', { bash: true }], false],
    [['a', 'b?(a|b)', { bash: true }], false],
    [['a((((b', 'a(*b', { bash: true }], true],
    [['a((((b', 'a(b', { bash: true }], false],
    [['a((((b', 'a\\(b', { bash: true }], false],
    [['a((b', 'a(*b', { bash: true }], true],
    [['a((b', 'a(b', { bash: true }], false],
    [['a((b', 'a\\(b', { bash: true }], false],
    [['a(b', 'a(*b', { bash: true }], true],
    [['a(b', 'a(b', { bash: true }], true],
    [['a\\(b', 'a\\(b', { bash: true }], false],
    [['a(b', 'a\\(b', { bash: true }], true],
    [['a.', '!(*.a|*.b|*.c)', { bash: true }], true],
    [['a.', '*!(.a|.b|.c)', { bash: true }], true],
    [['a.', '*.!(a)', { bash: true }], true],
    [['a.', '*.!(a|b|c)', { bash: true }], true],
    [['a.', '*.(a|b|@(ab|a*@(b))*(c)d)', { bash: true }], false],
    [['a.', '*.+(b|d)', { bash: true }], false],
    [['a.a', '!(*.[a-b]*)', { bash: true }], false],
    [['a.a', '!(*.a|*.b|*.c)', { bash: true }], false],
    [['a.a', '!(*[a-b].[a-b]*)', { bash: true }], false],
    [['a.a', '!*.(a|b)', { bash: true }], false],
    [['a.a', '!*.(a|b)*', { bash: true }], false],
    [['a.a', '(a|d).(a|b)*', { bash: true }], true],
    [['a.a', '(b|a).(a)', { bash: true }], true],
    [['a.a', '*!(.a|.b|.c)', { bash: true }], true],
    [['a.a', '*.!(a)', { bash: true }], false],
    [['a.a', '*.!(a|b|c)', { bash: true }], false],
    [['a.a', '*.(a|b|@(ab|a*@(b))*(c)d)', { bash: true }], true],
    [['a.a', '*.+(b|d)', { bash: true }], false],
    [['a.a', '@(b|a).@(a)', { bash: true }], true],
    [['a.a.a', '!(*.[a-b]*)', { bash: true }], false],
    [['a.a.a', '!(*[a-b].[a-b]*)', { bash: true }], false],
    [['a.a.a', '!*.(a|b)', { bash: true }], false],
    [['a.a.a', '!*.(a|b)*', { bash: true }], false],
    [['a.a.a', '*.!(a)', { bash: true }], true],
    [['a.a.a', '*.+(b|d)', { bash: true }], false],
    [['a.aa.a', '(b|a).(a)', { bash: true }], false],
    [['a.aa.a', '@(b|a).@(a)', { bash: true }], false],
    [['a.abcd', '!(*.a|*.b|*.c)', { bash: true }], true],
    [['a.abcd', '!(*.a|*.b|*.c)*', { bash: true }], false],
    [['a.abcd', '*!(*.a|*.b|*.c)*', { bash: true }], true],
    [['a.abcd', '*!(.a|.b|.c)', { bash: true }], true],
    [['a.abcd', '*.!(a|b|c)', { bash: true }], true],
    [['a.abcd', '*.!(a|b|c)*', { bash: true }], false],
    [['a.abcd', '*.(a|b|@(ab|a*@(b))*(c)d)', { bash: true }], true],
    [['a.b', '!(*.*)', { bash: true }], false],
    [['a.b', '!(*.[a-b]*)', { bash: true }], false],
    [['a.b', '!(*.a|*.b|*.c)', { bash: true }], false],
    [['a.b', '!(*[a-b].[a-b]*)', { bash: true }], false],
    [['a.b', '!*.(a|b)', { bash: true }], false],
    [['a.b', '!*.(a|b)*', { bash: true }], false],
    [['a.b', '(a|d).(a|b)*', { bash: true }], true],
    [['a.b', '*!(.a|.b|.c)', { bash: true }], true],
    [['a.b', '*.!(a)', { bash: true }], true],
    [['a.b', '*.!(a|b|c)', { bash: true }], false],
    [['a.b', '*.(a|b|@(ab|a*@(b))*(c)d)', { bash: true }], true],
    [['a.b', '*.+(b|d)', { bash: true }], true],
    [['a.bb', '!(*.[a-b]*)', { bash: true }], false],
    [['a.bb', '!(*[a-b].[a-b]*)', { bash: true }], false],
    [['a.bb', '!*.(a|b)', { bash: true }], true],
    [['a.bb', '!*.(a|b)*', { bash: true }], false],
    [['a.bb', '!*.*(a|b)', { bash: true }], false],
    [['a.bb', '(a|d).(a|b)*', { bash: true }], true],
    [['a.bb', '(b|a).(a)', { bash: true }], false],
    [['a.bb', '*.+(b|d)', { bash: true }], true],
    [['a.bb', '@(b|a).@(a)', { bash: true }], false],
    [['a.c', '!(*.a|*.b|*.c)', { bash: true }], false],
    [['a.c', '*!(.a|.b|.c)', { bash: true }], true],
    [['a.c', '*.!(a|b|c)', { bash: true }], false],
    [['a.c', '*.(a|b|@(ab|a*@(b))*(c)d)', { bash: true }], false],
    [['a.c.d', '!(*.a|*.b|*.c)', { bash: true }], true],
    [['a.c.d', '*!(.a|.b|.c)', { bash: true }], true],
    [['a.c.d', '*.!(a|b|c)', { bash: true }], true],
    [['a.c.d', '*.(a|b|@(ab|a*@(b))*(c)d)', { bash: true }], false],
    [['a.ccc', '!(*.[a-b]*)', { bash: true }], true],
    [['a.ccc', '!(*[a-b].[a-b]*)', { bash: true }], true],
    [['a.ccc', '!*.(a|b)', { bash: true }], true],
    [['a.ccc', '!*.(a|b)*', { bash: true }], true],
    [['a.ccc', '*.+(b|d)', { bash: true }], false],
    [['a.js', '!(*.js)', { bash: true }], false],
    [['a.js', '*!(.js)', { bash: true }], true],
    [['a.js', '*.!(js)', { bash: true }], false],
    [['a.js', 'a.!(js)', { bash: true }], false],
    [['a.js', 'a.!(js)*', { bash: true }], false],
    [['a.js.js', '!(*.js)', { bash: true }], false],
    [['a.js.js', '*!(.js)', { bash: true }], true],
    [['a.js.js', '*.!(js)', { bash: true }], true],
    [['a.js.js', '*.*(js).js', { bash: true }], true],
    [['a.md', '!(*.js)', { bash: true }], true],
    [['a.md', '*!(.js)', { bash: true }], true],
    [['a.md', '*.!(js)', { bash: true }], true],
    [['a.md', 'a.!(js)', { bash: true }], true],
    [['a.md', 'a.!(js)*', { bash: true }], true],
    [['a.md.js', '*.*(js).js', { bash: true }], false],
    [['a.txt', 'a.!(js)', { bash: true }], true],
    [['a.txt', 'a.!(js)*', { bash: true }], true],
    [['a/!(z)', 'a/!(z)', { bash: true }], true],
    [['a/b', 'a/!(z)', { bash: true }], true],
    [['a/b/c.txt', '*/b/!(*).txt', { bash: true }], false],
    [['a/b/c.txt', '*/b/!(c).txt', { bash: true }], false],
    [['a/b/c.txt', '*/b/!(cc).txt', { bash: true }], true],
    [['a/b/cc.txt', '*/b/!(*).txt', { bash: true }], false],
    [['a/b/cc.txt', '*/b/!(c).txt', { bash: true }], false],
    [['a/b/cc.txt', '*/b/!(cc).txt', { bash: true }], false],
    [['a/dir/foo.txt', '*/dir/**/!(bar).txt', { bash: true }], true],
    [['a/z', 'a/!(z)', { bash: true }], false],
    [['a\\(b', 'a(*b', { bash: true }], false],
    [['a\\(b', 'a(b', { bash: true }], false],
    [['a\\\\z', 'a\\\\z', { unixify: false }], false],
    [['a\\\\z', 'a\\\\z', { bash: true }], false],
    [['a\\b', 'a/b', { unixify: true }], true],
    [['a\\z', 'a\\\\z', { unixify: false }], true],
    [['a\\z', 'a\\\\z', { bash: true }], false],
    [['aa', '!(a!(b))', { bash: true }], false],
    [['aa', '!(a)', { bash: true }], true],
    [['aa', '!(a)*', { bash: true }], false],
    [['aa', '?', { bash: true }], false],
    [['aa', '@(a)b', { bash: true }], false],
    [['aa', 'a!(b)*', { bash: true }], true],
    [['aa', 'a??b', { bash: true }], false],
    [['aa.aa', '(b|a).(a)', { bash: true }], false],
    [['aa.aa', '@(b|a).@(a)', { bash: true }], false],
    [['aaa', '!(a)*', { bash: true }], false],
    [['aaa', 'a!(b)*', { bash: true }], true],
    [['aaaaaaabababab', '*ab', { bash: true }], true],
    [['aaac', '*(@(a))a@(c)', { bash: true }], true],
    [['aaaz', '[a*(]*z', { bash: true }], true],
    [['aab', '!(a)*', { bash: true }], false],
    [['aab', '?', { bash: true }], false],
    [['aab', '??', { bash: true }], false],
    [['aab', '@(c)b', { bash: true }], false],
    [['aab', 'a!(b)*', { bash: true }], true],
    [['aab', 'a??b', { bash: true }], false],
    [['aac', '*(@(a))a@(c)', { bash: true }], true],
    [['aac', '*(@(a))b@(c)', { bash: true }], false],
    [['aax', 'a!(a*|b)', { bash: true }], false],
    [['aax', 'a!(x*|b)', { bash: true }], true],
    [['aax', 'a?(a*|b)', { bash: true }], true],
    [['aaz', '[a*(]*z', { bash: true }], true],
    [['ab', '!(*.*)', { bash: true }], true],
    [['ab', '!(a!(b))', { bash: true }], true],
    [['ab', '!(a)*', { bash: true }], false],
    [['ab', '@(a+|b)*', { bash: true }], true],
    [['ab', '(a+|b)+', { bash: true }], true],
    [['ab', '*?(a)bc', { bash: true }], false],
    [['ab', 'a!(*(b|B))', { bash: true }], false],
    [['ab', 'a!(@(b|B))', { bash: true }], false],
    [['aB', 'a!(@(b|B))', { bash: true }], false],
    [['ab', 'a!(b)*', { bash: true }], false],
    [['ab', 'a(*b', { bash: true }], false],
    [['ab', 'a(b', { bash: true }], false],
    [['ab', 'a(b*(foo|bar))d', { bash: true }], false],
    [['ab', 'a/b', { unixify: true }], false],
    [['ab', 'a\\(b', { bash: true }], false],
    [['ab', 'ab*(e|f)', { bash: true }], true],
    [['ab', 'ab**', { bash: true }], true],
    [['ab', 'ab**(e|f)', { bash: true }], true],
    [['ab', 'ab**(e|f)g', { bash: true }], false],
    [['ab', 'ab***ef', { bash: true }], false],
    [['ab', 'ab*+(e|f)', { bash: true }], false],
    [['ab', 'ab*d+(e|f)', { bash: true }], false],
    [['ab', 'ab?*(e|f)', { bash: true }], false],
    [['ab/cXd/efXg/hi', '**/*X*/**/*i', { bash: true }], true],
    [['ab/cXd/efXg/hi', '*/*X*/*/*i', { bash: true }], true],
    [['ab/cXd/efXg/hi', '*X*i', { bash: true }], true],
    [['ab/cXd/efXg/hi', '*Xg*i', { bash: true }], true],
    [['ab]', 'a!(@(b|B))', { bash: true }], true],
    [['abab', '(a+|b)*', { bash: true }], true],
    [['abab', '(a+|b)+', { bash: true }], true],
    [['abab', '*?(a)bc', { bash: true }], false],
    [['abab', 'a(b*(foo|bar))d', { bash: true }], false],
    [['abab', 'ab*(e|f)', { bash: true }], false],
    [['abab', 'ab**', { bash: true }], true],
    [['abab', 'ab**(e|f)', { bash: true }], true],
    [['abab', 'ab**(e|f)g', { bash: true }], false],
    [['abab', 'ab***ef', { bash: true }], false],
    [['abab', 'ab*+(e|f)', { bash: true }], false],
    [['abab', 'ab*d+(e|f)', { bash: true }], false],
    [['abab', 'ab?*(e|f)', { bash: true }], false],
    [['abb', '!(*.*)', { bash: true }], true],
    [['abb', '!(a)*', { bash: true }], false],
    [['abb', 'a!(b)*', { bash: true }], false],
    [['abbcd', '@(ab|a*(b))*(c)d', { bash: true }], true],
    [['abc', '\\a\\b\\c', { bash: true }], false],
    [['aBc', 'a!(@(b|B))', { bash: true }], true],
    [['abcd', '?@(a|b)*@(c)d', { bash: true }], true],
    [['abcd', '@(ab|a*@(b))*(c)d', { bash: true }], true],
    [['abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt', '**/*a*b*g*n*t', { bash: true }], true],
    [['abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz', '**/*a*b*g*n*t', { bash: true }], false],
    [['abcdef', '(a+|b)*', { bash: true }], true],
    [['abcdef', '(a+|b)+', { bash: true }], false],
    [['abcdef', '*?(a)bc', { bash: true }], false],
    [['abcdef', 'a(b*(foo|bar))d', { bash: true }], false],
    [['abcdef', 'ab*(e|f)', { bash: true }], false],
    [['abcdef', 'ab**', { bash: true }], true],
    [['abcdef', 'ab**(e|f)', { bash: true }], true],
    [['abcdef', 'ab**(e|f)g', { bash: true }], false],
    [['abcdef', 'ab***ef', { bash: true }], true],
    [['abcdef', 'ab*+(e|f)', { bash: true }], true],
    [['abcdef', 'ab*d+(e|f)', { bash: true }], true],
    [['abcdef', 'ab?*(e|f)', { bash: true }], false],
    [['abcfef', '(a+|b)*', { bash: true }], true],
    [['abcfef', '(a+|b)+', { bash: true }], false],
    [['abcfef', '*?(a)bc', { bash: true }], false],
    [['abcfef', 'a(b*(foo|bar))d', { bash: true }], false],
    [['abcfef', 'ab*(e|f)', { bash: true }], false],
    [['abcfef', 'ab**', { bash: true }], true],
    [['abcfef', 'ab**(e|f)', { bash: true }], true],
    [['abcfef', 'ab**(e|f)g', { bash: true }], false],
    [['abcfef', 'ab***ef', { bash: true }], true],
    [['abcfef', 'ab*+(e|f)', { bash: true }], true],
    [['abcfef', 'ab*d+(e|f)', { bash: true }], false],
    [['abcfef', 'ab?*(e|f)', { bash: true }], true],
    [['abcfefg', '(a+|b)*', { bash: true }], true],
    [['abcfefg', '(a+|b)+', { bash: true }], false],
    [['abcfefg', '*?(a)bc', { bash: true }], false],
    [['abcfefg', 'a(b*(foo|bar))d', { bash: true }], false],
    [['abcfefg', 'ab*(e|f)', { bash: true }], false],
    [['abcfefg', 'ab**', { bash: true }], true],
    [['abcfefg', 'ab**(e|f)', { bash: true }], true],
    [['abcfefg', 'ab**(e|f)g', { bash: true }], true],
    [['abcfefg', 'ab***ef', { bash: true }], false],
    [['abcfefg', 'ab*+(e|f)', { bash: true }], false],
    [['abcfefg', 'ab*d+(e|f)', { bash: true }], false],
    [['abcfefg', 'ab?*(e|f)', { bash: true }], false],
    [['abcx', '!([[*])*', { bash: true }], true],
    [['abcx', '+(a|b\\[)*', { bash: true }], true],
    [['abcx', '[a*(]*z', { bash: true }], false],
    [['abcXdefXghi', '*X*i', { bash: true }], true],
    [['abcz', '!([[*])*', { bash: true }], true],
    [['abcz', '+(a|b\\[)*', { bash: true }], true],
    [['abcz', '[a*(]*z', { bash: true }], true],
    [['abd', '(a+|b)*', { bash: true }], true],
    [['abd', '(a+|b)+', { bash: true }], false],
    [['abd', '*?(a)bc', { bash: true }], false],
    [['abd', 'a!(*(b|B))', { bash: true }], true],
    [['abd', 'a!(@(b|B))', { bash: true }], true],
    [['abd', 'a!(@(b|B))d', { bash: true }], false],
    [['abd', 'a(b*(foo|bar))d', { bash: true }], true],
    [['abd', 'a+(b|c)d', { bash: true }], true],
    [['abd', 'a[b*(foo|bar)]d', { bash: true }], true],
    [['abd', 'ab*(e|f)', { bash: true }], false],
    [['abd', 'ab**', { bash: true }], true],
    [['abd', 'ab**(e|f)', { bash: true }], true],
    [['abd', 'ab**(e|f)g', { bash: true }], false],
    [['abd', 'ab***ef', { bash: true }], false],
    [['abd', 'ab*+(e|f)', { bash: true }], false],
    [['abd', 'ab*d+(e|f)', { bash: true }], false],
    [['abd', 'ab?*(e|f)', { bash: true }], true],
    [['abef', '(a+|b)*', { bash: true }], true],
    [['abef', '(a+|b)+', { bash: true }], false],
    [['abef', '*(a+|b)', { bash: true }], false],
    [['abef', '*?(a)bc', { bash: true }], false],
    [['abef', 'a(b*(foo|bar))d', { bash: true }], false],
    [['abef', 'ab*(e|f)', { bash: true }], true],
    [['abef', 'ab**', { bash: true }], true],
    [['abef', 'ab**(e|f)', { bash: true }], true],
    [['abef', 'ab**(e|f)g', { bash: true }], false],
    [['abef', 'ab***ef', { bash: true }], true],
    [['abef', 'ab*+(e|f)', { bash: true }], true],
    [['abef', 'ab*d+(e|f)', { bash: true }], false],
    [['abef', 'ab?*(e|f)', { bash: true }], true],
    [['abz', 'a!(*)', { bash: true }], false],
    [['abz', 'a!(z)', { bash: true }], true],
    [['abz', 'a*!(z)', { bash: true }], true],
    [['abz', 'a*(z)', { bash: true }], false],
    [['abz', 'a**(z)', { bash: true }], true],
    [['abz', 'a*@(z)', { bash: true }], true],
    [['abz', 'a+(z)', { bash: true }], false],
    [['abz', 'a?(z)', { bash: true }], false],
    [['abz', 'a@(z)', { bash: true }], false],
    [['ac', '!(a)*', { bash: true }], false],
    [['ac', '*(@(a))a@(c)', { bash: true }], true],
    [['ac', 'a!(*(b|B))', { bash: true }], true],
    [['ac', 'a!(@(b|B))', { bash: true }], true],
    [['ac', 'a!(b)*', { bash: true }], true],
    [['accdef', '(a+|b)*', { bash: true }], true],
    [['accdef', '(a+|b)+', { bash: true }], false],
    [['accdef', '*?(a)bc', { bash: true }], false],
    [['accdef', 'a(b*(foo|bar))d', { bash: true }], false],
    [['accdef', 'ab*(e|f)', { bash: true }], false],
    [['accdef', 'ab**', { bash: true }], false],
    [['accdef', 'ab**(e|f)', { bash: true }], false],
    [['accdef', 'ab**(e|f)g', { bash: true }], false],
    [['accdef', 'ab***ef', { bash: true }], false],
    [['accdef', 'ab*+(e|f)', { bash: true }], false],
    [['accdef', 'ab*d+(e|f)', { bash: true }], false],
    [['accdef', 'ab?*(e|f)', { bash: true }], false],
    [['acd', '(a+|b)*', { bash: true }], true],
    [['acd', '(a+|b)+', { bash: true }], false],
    [['acd', '*?(a)bc', { bash: true }], false],
    [['acd', '@(ab|a*(b))*(c)d', { bash: true }], true],
    [['acd', 'a!(*(b|B))', { bash: true }], true],
    [['acd', 'a!(@(b|B))', { bash: true }], true],
    [['acd', 'a!(@(b|B))d', { bash: true }], true],
    [['acd', 'a(b*(foo|bar))d', { bash: true }], false],
    [['acd', 'a+(b|c)d', { bash: true }], true],
    [['acd', 'a[b*(foo|bar)]d', { bash: true }], false],
    [['acd', 'ab*(e|f)', { bash: true }], false],
    [['acd', 'ab**', { bash: true }], false],
    [['acd', 'ab**(e|f)', { bash: true }], false],
    [['acd', 'ab**(e|f)g', { bash: true }], false],
    [['acd', 'ab***ef', { bash: true }], false],
    [['acd', 'ab*+(e|f)', { bash: true }], false],
    [['acd', 'ab*d+(e|f)', { bash: true }], false],
    [['acd', 'ab?*(e|f)', { bash: true }], false],
    [['ax', '?(a*|b)', { bash: true }], true],
    [['ax', 'a?(b*)', { bash: true }], false],
    [['axz', 'a+(z)', { bash: true }], false],
    [['az', 'a!(*)', { bash: true }], false],
    [['az', 'a!(z)', { bash: true }], false],
    [['az', 'a*!(z)', { bash: true }], true],
    [['az', 'a*(z)', { bash: true }], true],
    [['az', 'a**(z)', { bash: true }], true],
    [['az', 'a*@(z)', { bash: true }], true],
    [['az', 'a+(z)', { bash: true }], true],
    [['az', 'a?(z)', { bash: true }], true],
    [['az', 'a@(z)', { bash: true }], true],
    [['az', 'a\\\\z', { unixify: false }], false],
    [['az', 'a\\\\z', { bash: true }], false],
    [['b', '!(a)*', { bash: true }], true],
    [['b', '(a+|b)*', { bash: true }], true],
    [['b', 'a!(b)*', { bash: true }], false],
    [['b.a', '(b|a).(a)', { bash: true }], true],
    [['b.a', '@(b|a).@(a)', { bash: true }], true],
    [['b/a', '!(b/a)', { bash: true }], false],
    [['b/b', '!(b/a)', { bash: true }], true],
    [['b/c', '!(b/a)', { bash: true }], true],
    [['b/c', 'b/!(c)', { bash: true }], false],
    [['b/c', 'b/!(cc)', { bash: true }], true],
    [['b/c.txt', 'b/!(c).txt', { bash: true }], false],
    [['b/c.txt', 'b/!(cc).txt', { bash: true }], true],
    [['b/cc', 'b/!(c)', { bash: true }], true],
    [['b/cc', 'b/!(cc)', { bash: true }], false],
    [['b/cc.txt', 'b/!(c).txt', { bash: true }], false],
    [['b/cc.txt', 'b/!(cc).txt', { bash: true }], false],
    [['b/ccc', 'b/!(c)', { bash: true }], true],
    [['ba', '!(a!(b))', { bash: true }], true],
    [['ba', 'b?(a|b)', { bash: true }], true],
    [['baaac', '*(@(a))a@(c)', { bash: true }], false],
    [['bar', '!(foo)', { bash: true }], true],
    [['bar', '!(foo)*', { bash: true }], true],
    [['bar', '!(foo)b*', { bash: true }], true],
    [['bar', '*(!(foo))', { bash: true }], true],
    [['baz', '!(foo)*', { bash: true }], true],
    [['baz', '!(foo)b*', { bash: true }], true],
    [['baz', '*(!(foo))', { bash: true }], true],
    [['bb', '!(a!(b))', { bash: true }], true],
    [['bb', '!(a)*', { bash: true }], true],
    [['bb', 'a!(b)*', { bash: true }], false],
    [['bb', 'a?(a|b)', { bash: true }], false],
    [['bbc', '!([[*])*', { bash: true }], true],
    [['bbc', '+(a|b\\[)*', { bash: true }], false],
    [['bbc', '[a*(]*z', { bash: true }], false],
    [['bz', 'a+(z)', { bash: true }], false],
    [['c', '*(@(a))a@(c)', { bash: true }], false],
    [['c.a', '!(*.[a-b]*)', { bash: true }], false],
    [['c.a', '!(*[a-b].[a-b]*)', { bash: true }], true],
    [['c.a', '!*.(a|b)', { bash: true }], false],
    [['c.a', '!*.(a|b)*', { bash: true }], false],
    [['c.a', '(b|a).(a)', { bash: true }], false],
    [['c.a', '*.!(a)', { bash: true }], false],
    [['c.a', '*.+(b|d)', { bash: true }], false],
    [['c.a', '@(b|a).@(a)', { bash: true }], false],
    [['c.c', '!(*.a|*.b|*.c)', { bash: true }], false],
    [['c.c', '*!(.a|.b|.c)', { bash: true }], true],
    [['c.c', '*.!(a|b|c)', { bash: true }], false],
    [['c.c', '*.(a|b|@(ab|a*@(b))*(c)d)', { bash: true }], false],
    [['c.ccc', '!(*.[a-b]*)', { bash: true }], true],
    [['c.ccc', '!(*[a-b].[a-b]*)', { bash: true }], true],
    [['c.js', '!(*.js)', { bash: true }], false],
    [['c.js', '*!(.js)', { bash: true }], true],
    [['c.js', '*.!(js)', { bash: true }], false],
    [['c/a/v', 'c/!(z)/v', { bash: true }], true],
    [['c/a/v', 'c/*(z)/v', { bash: true }], false],
    [['c/a/v', 'c/+(z)/v', { bash: true }], false],
    [['c/a/v', 'c/@(z)/v', { bash: true }], false],
    [['c/z/v', '*(z)', { bash: true }], false],
    [['c/z/v', '+(z)', { bash: true }], false],
    [['c/z/v', '?(z)', { bash: true }], false],
    [['c/z/v', 'c/!(z)/v', { bash: true }], false],
    [['c/z/v', 'c/*(z)/v', { bash: true }], true],
    [['c/z/v', 'c/+(z)/v', { bash: true }], true],
    [['c/z/v', 'c/@(z)/v', { bash: true }], true],
    [['c/z/v', 'c/z/v', { bash: true }], true],
    [['cc.a', '(b|a).(a)', { bash: true }], false],
    [['cc.a', '@(b|a).@(a)', { bash: true }], false],
    [['ccc', '!(a)*', { bash: true }], true],
    [['ccc', 'a!(b)*', { bash: true }], false],
    [['cow', '!(*.*)', { bash: true }], true],
    [['cow', '!(*.*).', { bash: true }], false],
    [['cow', '.!(*.*)', { bash: true }], false],
    [['cz', 'a!(*)', { bash: true }], false],
    [['cz', 'a!(z)', { bash: true }], false],
    [['cz', 'a*!(z)', { bash: true }], false],
    [['cz', 'a*(z)', { bash: true }], false],
    [['cz', 'a**(z)', { bash: true }], false],
    [['cz', 'a*@(z)', { bash: true }], false],
    [['cz', 'a+(z)', { bash: true }], false],
    [['cz', 'a?(z)', { bash: true }], false],
    [['cz', 'a@(z)', { bash: true }], false],
    [['d.a.d', '!(*.[a-b]*)', { bash: true }], false],
    [['d.a.d', '!(*[a-b].[a-b]*)', { bash: true }], true],
    [['d.a.d', '!*.(a|b)*', { bash: true }], false],
    [['d.a.d', '!*.*(a|b)', { bash: true }], true],
    [['d.a.d', '!*.{a,b}*', { bash: true }], false],
    [['d.a.d', '*.!(a)', { bash: true }], true],
    [['d.a.d', '*.+(b|d)', { bash: true }], true],
    [['d.d', '!(*.a|*.b|*.c)', { bash: true }], true],
    [['d.d', '*!(.a|.b|.c)', { bash: true }], true],
    [['d.d', '*.!(a|b|c)', { bash: true }], true],
    [['d.d', '*.(a|b|@(ab|a*@(b))*(c)d)', { bash: true }], false],
    [['d.js.d', '!(*.js)', { bash: true }], true],
    [['d.js.d', '*!(.js)', { bash: true }], true],
    [['d.js.d', '*.!(js)', { bash: true }], true],
    [['dd.aa.d', '(b|a).(a)', { bash: true }], false],
    [['dd.aa.d', '@(b|a).@(a)', { bash: true }], false],
    [['def', '()ef', { bash: true }], false],
    [['e.e', '!(*.a|*.b|*.c)', { bash: true }], true],
    [['e.e', '*!(.a|.b|.c)', { bash: true }], true],
    [['e.e', '*.!(a|b|c)', { bash: true }], true],
    [['e.e', '*.(a|b|@(ab|a*@(b))*(c)d)', { bash: true }], false],
    [['ef', '()ef', { bash: true }], true],
    [['effgz', '@(b+(c)d|e*(f)g?|?(h)i@(j|k))', { bash: true }], true],
    [['efgz', '@(b+(c)d|e*(f)g?|?(h)i@(j|k))', { bash: true }], true],
    [['egz', '@(b+(c)d|e*(f)g?|?(h)i@(j|k))', { bash: true }], true],
    [['egz', '@(b+(c)d|e+(f)g?|?(h)i@(j|k))', { bash: true }], false],
    [['egzefffgzbcdij', '*(b+(c)d|e*(f)g?|?(h)i@(j|k))', { bash: true }], true],
    [['f', '!(f!(o))', { bash: true }], false],
    [['f', '!(f(o))', { bash: true }], true],
    [['f', '!(f)', { bash: true }], false],
    [['f', '*(!(f))', { bash: true }], false],
    [['f', '+(!(f))', { bash: true }], false],
    [['f.a', '!(*.a|*.b|*.c)', { bash: true }], false],
    [['f.a', '*!(.a|.b|.c)', { bash: true }], true],
    [['f.a', '*.!(a|b|c)', { bash: true }], false],
    [['f.f', '!(*.a|*.b|*.c)', { bash: true }], true],
    [['f.f', '*!(.a|.b|.c)', { bash: true }], true],
    [['f.f', '*.!(a|b|c)', { bash: true }], true],
    [['f.f', '*.(a|b|@(ab|a*@(b))*(c)d)', { bash: true }], false],
    [['fa', '!(f!(o))', { bash: true }], false],
    [['fa', '!(f(o))', { bash: true }], true],
    [['fb', '!(f!(o))', { bash: true }], false],
    [['fb', '!(f(o))', { bash: true }], true],
    [['fff', '!(f)', { bash: true }], true],
    [['fff', '*(!(f))', { bash: true }], true],
    [['fff', '+(!(f))', { bash: true }], true],
    [['fffooofoooooffoofffooofff', '*(*(f)*(o))', { bash: true }], true],
    [['ffo', '*(f*(o))', { bash: true }], true],
    [['file.C', '*.c?(c)', { bash: true }], false],
    [['file.c', '*.c?(c)', { bash: true }], true],
    [['file.cc', '*.c?(c)', { bash: true }], true],
    [['file.ccc', '*.c?(c)', { bash: true }], false],
    [['fo', '!(f!(o))', { bash: true }], true],
    [['fo', '!(f(o))', { bash: true }], false],
    [['fofo', '*(f*(o))', { bash: true }], true],
    [['fofoofoofofoo', '*(fo|foo)', { bash: true }], true, 'Should backtrack in alternation matches'],
    [['fofoofoofofoo', '*(fo|foo)', { bash: true }], true],
    [['foo', '!(!(foo))', { bash: true }], true],
    [['foo', '!(f)', { bash: true }], true],
    [['foo', '!(foo)', { bash: true }], false],
    [['foo', '!(foo)*', { bash: true }], false],
    [['foo', '!(foo)*', { bash: true }], false], // bash 4.3 disagrees
    [['foo', '!(foo)+', { bash: true }], false],
    [['foo', '!(foo)b*', { bash: true }], false],
    [['foo', '!(x)', { bash: true }], true],
    [['foo', '!(x)*', { bash: true }], true],
    [['foo', '*', { bash: true }], true],
    [['foo', '*(!(f))', { bash: true }], true],
    [['foo', '*(!(foo))', { bash: true }], false],
    [['foo', '*(@(a))a@(c)', { bash: true }], false],
    [['foo', '*(@(foo))', { bash: true }], true],
    [['foo', '*(a|b\\[)', { bash: true }], false],
    [['foo', '*(a|b\\[)|f*', { bash: true }], true],
    [['foo', '@(*(a|b\\[)|f*)', { bash: true }], true],
    [['foo', '*/*/*', { bash: true }], false],
    [['foo', '*f', { bash: true }], false],
    [['foo', '*foo*', { bash: true }], true],
    [['foo', '+(!(f))', { bash: true }], true],
    [['foo', '??', { bash: true }], false],
    [['foo', '???', { bash: true }], true],
    [['foo', 'bar', { bash: true }], false],
    [['foo', 'f*', { bash: true }], true],
    [['foo', 'fo', { bash: true }], false],
    [['foo', 'foo', { bash: true }], true],
    [['foo', '{*(a|b\\[),f*}', { bash: true }], true],
    [['foo*', 'foo\\*', { unixify: false }], true],
    [['foo*bar', 'foo\\*bar', { bash: true }], true],
    [['foo.js', '!(foo).js', { bash: true }], false],
    [['foo.js.js', '*.!(js)', { bash: true }], true],
    [['foo.js.js', '*.!(js)*', { bash: true }], false],
    [['foo.js.js', '*.!(js)*.!(js)', { bash: true }], false],
    [['foo.js.js', '*.!(js)+', { bash: true }], false],
    [['foo.txt', '**/!(bar).txt', { bash: true }], true],
    [['foo/bar', '*/*/*', { bash: true }], false],
    [['foo/bar', 'foo/!(foo)', { bash: true }], true],
    [['foo/bar', 'foo/*', { bash: true }], true],
    [['foo/bar', 'foo/bar', { bash: true }], true],
    [['foo/bar', 'foo?bar', { bash: true }], true],
    [['foo/bar', 'foo[/]bar', { bash: true }], true],
    [['foo/bar/baz.jsx', 'foo/bar/**/*.+(js|jsx)', { bash: true }], true],
    [['foo/bar/baz.jsx', 'foo/bar/*.+(js|jsx)', { bash: true }], true],
    [['foo/bb/aa/rr', '**/**/**', { bash: true }], true],
    [['foo/bb/aa/rr', '*/*/*', { bash: true }], true],
    [['foo/bba/arr', '*/*/*', { bash: true }], true],
    [['foo/bba/arr', 'foo*', { bash: true }], true],
    [['foo/bba/arr', 'foo**', { bash: true }], true],
    [['foo/bba/arr', 'foo/*', { bash: true }], true],
    [['foo/bba/arr', 'foo/**', { bash: true }], true],
    [['foo/bba/arr', 'foo/**arr', { bash: true }], true],
    [['foo/bba/arr', 'foo/**z', { bash: true }], false],
    [['foo/bba/arr', 'foo/*arr', { bash: true }], true],
    [['foo/bba/arr', 'foo/*z', { bash: true }], false],
    [['foob', '!(foo)b*', { bash: true }], false],
    [['foob', '(foo)bb', { bash: true }], false],
    [['foobar', '!(foo)', { bash: true }], true],
    [['foobar', '!(foo)*', { bash: true }], false],
    [['foobar', '!(foo)*', { bash: true }], false], // bash 4.3 disagrees
    [['foobar', '!(foo)b*', { bash: true }], false],
    [['foobar', '*(!(foo))', { bash: true }], true],
    [['foobar', '*ob*a*r*', { bash: true }], true],
    [['foobar', 'foo\\*bar', { bash: true }], true],
    [['foobb', '!(foo)b*', { bash: true }], false], // bash 4.3 disagrees
    [['foobb', '(foo)bb', { bash: true }], true],
    [['foofoofo', '@(foo|f|fo)*(f|of+(o))', { bash: true }], true, 'Should match as fo+ofo+ofo'],
    [['foofoofo', '@(foo|f|fo)*(f|of+(o))', { bash: true }], true],
    [['fooofoofofooo', '*(f*(o))', { bash: true }], true],
    [['foooofo', '*(f*(o))', { bash: true }], true],
    [['foooofof', '*(f*(o))', { bash: true }], true],
    [['foooofof', '*(f+(o))', { bash: true }], false],
    [['foooofofx', '*(f*(o))', { bash: true }], false],
    [['foooxfooxfoxfooox', '*(f*(o)x)', { bash: true }], true],
    [['foooxfooxfxfooox', '*(f*(o)x)', { bash: true }], true],
    [['foooxfooxofoxfooox', '*(f*(o)x)', { bash: true }], false],
    [['foot', '@(!(z*)|*x)', { bash: true }], true],
    [['foox', '@(!(z*)|*x)', { bash: true }], true],
    [['fz', '*(z)', { bash: true }], false],
    [['fz', '+(z)', { bash: true }], false],
    [['fz', '?(z)', { bash: true }], false],
    [['moo.cow', '!(moo).!(cow)', { bash: true }], false],
    [['moo.cow', '!(*).!(*)', { bash: true }], false],
    [['moo.cow', '!(*.*).!(*.*)', { bash: true }], false], // bash 4.3 disagrees
    [['mad.moo.cow', '!(*.*).!(*.*)', { bash: true }], false],
    [['mad.moo.cow', '.!(*.*)', { bash: true }], false],
    [['Makefile', '!(*.c|*.h|Makefile.in|config*|README)', { bash: true }], true],
    [['Makefile.in', '!(*.c|*.h|Makefile.in|config*|README)', { bash: true }], false],
    [['moo', '!(*.*)', { bash: true }], true],
    [['moo', '!(*.*).', { bash: true }], false],
    [['moo', '.!(*.*)', { bash: true }], false],
    [['moo.cow', '!(*.*)', { bash: true }], false],
    [['moo.cow', '!(*.*).', { bash: true }], false],
    [['moo.cow', '.!(*.*)', { bash: true }], false],
    [['mucca.pazza', 'mu!(*(c))?.pa!(*(z))?', { bash: true }], false],
    [['ofoofo', '*(of+(o))', { bash: true }], true],
    [['ofoofo', '*(of+(o)|f)', { bash: true }], true],
    [['ofooofoofofooo', '*(f*(o))', { bash: true }], false],
    [['ofoooxoofxo', '*(*(of*(o)x)o)', { bash: true }], true],
    [['ofoooxoofxoofoooxoofxo', '*(*(of*(o)x)o)', { bash: true }], true],
    [['ofoooxoofxoofoooxoofxofo', '*(*(of*(o)x)o)', { bash: true }], false],
    [['ofoooxoofxoofoooxoofxoo', '*(*(of*(o)x)o)', { bash: true }], true],
    [['ofoooxoofxoofoooxoofxooofxofxo', '*(*(of*(o)x)o)', { bash: true }], true],
    [['ofxoofxo', '*(*(of*(o)x)o)', { bash: true }], true],
    [['oofooofo', '*(of|oof+(o))', { bash: true }], true],
    [['ooo', '!(f)', { bash: true }], true],
    [['ooo', '*(!(f))', { bash: true }], true],
    [['ooo', '+(!(f))', { bash: true }], true],
    [['oxfoxfox', '*(oxf+(ox))', { bash: true }], false],
    [['oxfoxoxfox', '*(oxf+(ox))', { bash: true }], true],
    [['para', 'para*([0-9])', { bash: true }], true],
    [['para', 'para+([0-9])', { bash: true }], false],
    [['para.38', 'para!(*.[00-09])', { bash: true }], true],
    [['para.graph', 'para!(*.[0-9])', { bash: true }], true],
    [['para13829383746592', 'para*([0-9])', { bash: true }], true],
    [['para381', 'para?([345]|99)1', { bash: true }], false],
    [['para39', 'para!(*.[0-9])', { bash: true }], true],
    [['para987346523', 'para+([0-9])', { bash: true }], true],
    [['para991', 'para?([345]|99)1', { bash: true }], true],
    [['paragraph', 'para!(*.[0-9])', { bash: true }], true],
    [['paragraph', 'para*([0-9])', { bash: true }], false],
    [['paragraph', 'para@(chute|graph)', { bash: true }], true],
    [['paramour', 'para@(chute|graph)', { bash: true }], false],
    [['parse.y', '!(*.c|*.h|Makefile.in|config*|README)', { bash: true }], true],
    [['shell.c', '!(*.c|*.h|Makefile.in|config*|README)', { bash: true }], false],
    [['VMS.FILE;', '*\\;[1-9]*([0-9])', { bash: true }], false],
    [['VMS.FILE;0', '*\\;[1-9]*([0-9])', { bash: true }], false],
    [['VMS.FILE;9', '*\\;[1-9]*([0-9])', { bash: true }], false],
    [['VMS.FILE;1', '*\\;[1-9]*([0-9])', { bash: true }], false],
    [['VMS.FILE;1', '*;[1-9]*([0-9])', { bash: true }], true],
    [['VMS.FILE;139', '*\\;[1-9]*([0-9])', { bash: true }], false],
    [['VMS.FILE;1N', '*\\;[1-9]*([0-9])', { bash: true }], false],
    [['xfoooofof', '*(f*(o))', { bash: true }], false],
    [['XXX/adobe/courier/bold/o/normal//12/120/75/75/m/70/iso8859/1', 'XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*', { unixify: false } ], true ],
    [['XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1', 'XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*', { bash: true }], false],
    [['z', '*(z)', { bash: true }], true],
    [['z', '+(z)', { bash: true }], true],
    [['z', '?(z)', { bash: true }], true],
    [['zf', '*(z)', { bash: true }], false],
    [['zf', '+(z)', { bash: true }], false],
    [['zf', '?(z)', { bash: true }], false],
    [['zoot', '@(!(z*)|*x)', { bash: true }], false],
    [['zoox', '@(!(z*)|*x)', { bash: true }], true],
    [['zz', '(a+|b)*', { bash: true }], false]
  ];

  fixtures.forEach((unit, i) => {
    let n = i + offset; // add offset so line no. is correct in error messages
    if (argv.n !== void 0 && n !== argv.n) return;
    let args = unit[0];
    let expected = unit[1];

    it(`"${args[0]}" should ${expected ? '' : 'not '}match "${args[1]}"`, () => {
      assert.equal(pm.isMatch(...args), expected, util.inspect(args));
    });
  });
});
