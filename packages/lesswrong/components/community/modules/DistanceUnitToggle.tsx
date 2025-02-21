import { registerComponent, } from '../../../lib/vulcan-lib';
import React, { useEffect } from 'react';
import { createStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  root: {
    display: 'inline-block',
    ...theme.typography.commentStyle,
    marginLeft: 5
  },
  radio: {
    display: 'none'
  },
  label: {
    padding: '5px 10px',
    cursor: 'pointer',
    border: '1px solid #d4d4d4',
    '&.left': {
      borderRightColor: theme.palette.primary.dark,
      borderRadius: '4px 0 0 4px',
    },
    '&.right': {
      borderLeftWidth: 0,
      borderRadius: '0 4px 4px 0'
    },
    '&.selected': {
      backgroundColor: theme.palette.primary.main,
      color: 'white',
      borderColor: theme.palette.primary.dark,
    },
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      color: 'white',
      borderColor: theme.palette.primary.dark,
    }
  },
}))

const DistanceUnitToggle = ({distanceUnit='km', onChange, skipDefaultEffect, classes}: {
  distanceUnit: "km"|"mi",
  onChange: Function,
  skipDefaultEffect?: boolean,
  classes: ClassesType,
}) => {
  
  useEffect(() => {
    if (skipDefaultEffect) return
    
    // only US and UK default to miles - everyone else defaults to km
    // (this is checked here to allow SSR to work properly)
    if (['en-US', 'en-GB'].some(lang => lang === window?.navigator?.language)) {
      onChange('mi')
    }
    //No exhaustive deps because this is supposed to run only on mount
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  return <div className={classes.root}>
    <input type="radio" id="km" name="distanceUnit" value="km" className={classes.radio}
      checked={distanceUnit === 'km'} onChange={() => onChange('km')} />
    <label htmlFor="km" className={classNames(classes.label, 'left', {'selected': distanceUnit === 'km'})}>
      km
    </label>

    <input type="radio" id="mi" name="distanceUnit" value="mi" className={classes.radio}
      checked={distanceUnit === 'mi'} onChange={() => onChange('mi')} />
    <label htmlFor="mi" className={classNames(classes.label, 'right', {'selected': distanceUnit === 'mi'})}>
      mi
    </label>
  </div>
}

const DistanceUnitToggleComponent = registerComponent('DistanceUnitToggle', DistanceUnitToggle, {styles});

declare global {
  interface ComponentTypes {
    DistanceUnitToggle: typeof DistanceUnitToggleComponent
  }
}
