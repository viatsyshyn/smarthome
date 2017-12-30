module.exports = {
    't_delta.lambda': ($) => Promise.all([
            $.getProperty('temperature'),
            $.queryStats('temperature', -60 * 60, -50 * 60, 60)
        ]).then(([
            current,
            history
        ]) => ((history[0] || {}).temperature || current) - current),

    'h_delta.lambda': ($) => Promise.all([
            $.getProperty('humidity'),
            $.queryStats('humidity', -60 * 60, -50 * 60, 60)
        ]).then(([
            current,
            history
        ]) => ((history[0] || {}).humidity || current) - current),

    'active_since.lambda': ($) => $.getProperty('active-since').then(x => new Date(x)),

    'active.lambda': ($, value) => {
        $.setProperty('active-since', new Date().getTime());
        return value;
    }
};
