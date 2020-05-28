import * as React from 'react'
import * as classNames from 'classnames'

import { Repository } from '../../models/repository'

import { Diff } from './index'
import {
  WorkingDirectoryFileChange,
  CommittedFileChange,
} from '../../models/status'
import { DiffSelection, IDiff, ImageDiffType } from '../../models/diff'
import { Loading } from '../lib/loading'

type ChangedFile = WorkingDirectoryFileChange | CommittedFileChange

/** The props for the Diff component. */
interface ISeamlessDiffSwitcherProps {
  readonly repository: Repository

  /**
   * Whether the diff is readonly, e.g., displaying a historical diff, or the
   * diff's lines can be selected, e.g., displaying a change in the working
   * directory.
   */
  readonly readOnly: boolean

  /** The file whose diff should be displayed. */
  readonly file: ChangedFile

  /** Called when the includedness of lines or a range of lines has changed. */
  readonly onIncludeChanged?: (diffSelection: DiffSelection) => void

  /** The diff that should be rendered */
  readonly diff: IDiff | null

  /** The type of image diff to display. */
  readonly imageDiffType: ImageDiffType

  /** Hiding whitespace in diff. */
  readonly hideWhitespaceInDiff: boolean

  /**
   * Called when the user requests to open a binary file in an the
   * system-assigned application for said file type.
   */
  readonly onOpenBinaryFile: (fullPath: string) => void

  /**
   * Called when the user is viewing an image diff and requests
   * to change the diff presentation mode.
   */
  readonly onChangeImageDiffType: (type: ImageDiffType) => void
}

interface ISeamlessDiffSwitcherState {
  readonly isLoadingDiff: boolean
  readonly isLoadingSlow: boolean
  readonly props: ISeamlessDiffSwitcherProps
}

function noop() {}

/** represents the default view for a file that we cannot render a diff for */
export class SeamlessDiffSwitcher extends React.Component<
  ISeamlessDiffSwitcherProps,
  ISeamlessDiffSwitcherState
> {
  private slowLoadingTimeoutId: number | null = null

  public static getDerivedStateFromProps(
    props: ISeamlessDiffSwitcherProps,
    state: ISeamlessDiffSwitcherState
  ): Partial<ISeamlessDiffSwitcherState> {
    const isLoadingDiff = props.diff === null
    return {
      props: isLoadingDiff ? state.props : props,
      isLoadingDiff,
      isLoadingSlow:
        isLoadingDiff && !state.isLoadingDiff ? false : state.isLoadingSlow,
    }
  }

  public constructor(props: ISeamlessDiffSwitcherProps) {
    super(props)

    this.state = {
      isLoadingDiff: props.diff === null,
      isLoadingSlow: false,
      props: props,
    }
  }

  public componentDidMount() {
    if (this.state.isLoadingDiff) {
      this.scheduleSlowLoadingTimeout()
    }
  }

  public componentWillUnmount() {
    this.clearSlowLoadingTimeout()
  }

  public componentDidUpdate(
    prevProps: ISeamlessDiffSwitcherProps,
    prevState: ISeamlessDiffSwitcherState
  ) {
    // Have we transitioned from loading to not loading or vice versa?
    if (this.state.isLoadingDiff !== prevState.isLoadingDiff) {
      if (this.state.isLoadingDiff) {
        // If we've just begun loading the diff, start the timer
        this.scheduleSlowLoadingTimeout()
      } else {
        // If we're no longer loading the diff make sure that we're not
        // still counting down
        this.clearSlowLoadingTimeout()
      }
    }
  }

  private onSlowLoadingTimeout = () => {
    this.setState({ isLoadingSlow: true })
  }

  private scheduleSlowLoadingTimeout() {
    this.clearSlowLoadingTimeout()
    this.slowLoadingTimeoutId = window.setTimeout(
      this.onSlowLoadingTimeout,
      150
    )
  }

  private clearSlowLoadingTimeout() {
    if (this.slowLoadingTimeoutId !== null) {
      window.clearTimeout(this.slowLoadingTimeoutId)
      this.slowLoadingTimeoutId = null
    }
  }

  public render() {
    const { isLoadingDiff, isLoadingSlow } = this.state
    const {
      repository,
      imageDiffType,
      readOnly,
      hideWhitespaceInDiff,
      onIncludeChanged,
      diff,
      file,
      onOpenBinaryFile,
      onChangeImageDiffType,
    } = this.state.props

    const className = classNames('seamless-diff-switcher', {
      loading: isLoadingDiff,
      slow: isLoadingSlow,
      'has-diff': diff !== null,
    })

    const loadingIndicator = isLoadingDiff ? (
      <div className="loading-indicator">
        <Loading />
      </div>
    ) : null

    return (
      <div className={className}>
        {diff !== null ? (
          <Diff
            repository={repository}
            imageDiffType={imageDiffType}
            file={file}
            diff={diff}
            readOnly={readOnly}
            hideWhitespaceInDiff={hideWhitespaceInDiff}
            onIncludeChanged={isLoadingDiff ? noop : onIncludeChanged}
            onOpenBinaryFile={isLoadingDiff ? noop : onOpenBinaryFile}
            onChangeImageDiffType={isLoadingDiff ? noop : onChangeImageDiffType}
          />
        ) : null}
        {loadingIndicator}
      </div>
    )
  }
}
